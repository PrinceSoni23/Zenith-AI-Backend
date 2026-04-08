import { logger } from "../utils/logger";
import { getRedisClient } from "../config/redis.config";

interface RateLimitViolation {
  ip: string;
  userId?: string;
  endpoint: string;
  count: number;
  timestamp: number;
  severity: "low" | "medium" | "high" | "critical";
}

interface AnomalyPattern {
  pattern: "brute_force" | "ddos" | "spam" | "api_abuse";
  description: string;
  affectedIPs: string[];
  affectedUsers: string[];
  severity: "medium" | "high" | "critical";
  detectedAt: number;
  recommendation: string;
}

class RateLimitMonitor {
  private violations: Map<string, RateLimitViolation> = new Map();
  private anomalies: AnomalyPattern[] = [];
  private readonly ALERT_THRESHOLD = {
    LOW: 5,
    MEDIUM: 10,
    HIGH: 20,
    CRITICAL: 50,
  };

  /**
   * Record a rate limit violation
   */
  async recordViolation(
    ip: string,
    userId: string | undefined,
    endpoint: string,
  ): Promise<void> {
    const key = `${ip}:${endpoint}`;
    const violation = this.violations.get(key) || {
      ip,
      userId,
      endpoint,
      count: 0,
      timestamp: Date.now(),
      severity: "low",
    };

    violation.count++;

    // Determine severity
    if (violation.count >= this.ALERT_THRESHOLD.CRITICAL) {
      violation.severity = "critical";
    } else if (violation.count >= this.ALERT_THRESHOLD.HIGH) {
      violation.severity = "high";
    } else if (violation.count >= this.ALERT_THRESHOLD.MEDIUM) {
      violation.severity = "medium";
    } else {
      violation.severity = "low";
    }

    this.violations.set(key, violation);

    // Store in Redis for persistence
    const redis = getRedisClient();
    if (redis) {
      const redisKey = `violations:${key}`;
      await redis.incr(redisKey);
      await redis.expire(redisKey, 60 * 60); // Keep for 1 hour
    }

    // Alert if severity escalates
    if (violation.severity === "critical") {
      await this.alertCritical(violation);
    } else if (violation.severity === "high") {
      await this.alertHigh(violation);
    }
  }

  /**
   * Detect DDoS patterns (many requests from different IPs, same endpoint)
   */
  async detectDDoSPattern(endpoint: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    const pattern = `rl:*:${endpoint}`;
    const keys = await redis.keys(pattern);

    if (keys.length > 50) {
      // More than 50 users hitting same endpoint in short time = potential DDoS
      const anomaly: AnomalyPattern = {
        pattern: "ddos",
        description: `Potential DDoS attack detected on ${endpoint}`,
        affectedIPs: keys.map((k: string) => k.split(":")[1]),
        affectedUsers: [],
        severity: "critical",
        detectedAt: Date.now(),
        recommendation:
          "Enable stricter rate limiting, consider enabling CAPTCHA, check for bot activity",
      };

      this.anomalies.push(anomaly);
      await this.alertAnomaly(anomaly);
    }
  }

  /**
   * Detect brute force patterns (same IP, rapid auth failures)
   */
  async detectBruteForcePattern(ip: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    const authKey = `rl:auth:${ip}`;
    const count = await redis.get(authKey);

    if (count && parseInt(count) >= 4) {
      // 4+ failed attempts = brute force
      const anomaly: AnomalyPattern = {
        pattern: "brute_force",
        description: `Brute force attack detected from IP ${ip}`,
        affectedIPs: [ip],
        affectedUsers: [],
        severity: "high",
        detectedAt: Date.now(),
        recommendation:
          "Temporarily block IP, enable CAPTCHA, notify admins, consider requiring email verification",
      };

      this.anomalies.push(anomaly);
      await this.alertAnomaly(anomaly);
    }
  }

  /**
   * Detect spam patterns (same user, rapid low-value requests)
   */
  async detectSpamPattern(userId: string, endpoint: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    const spamKey = `spam:${userId}:${endpoint}`;
    const count = await redis.incr(spamKey);
    await redis.expire(spamKey, 60); // 1 minute window

    if (count > 30) {
      // 30+ requests in 1 minute = spam
      const anomaly: AnomalyPattern = {
        pattern: "spam",
        description: `Spam detected from user ${userId} on ${endpoint}`,
        affectedIPs: [],
        affectedUsers: [userId],
        severity: "medium",
        detectedAt: Date.now(),
        recommendation:
          "Warn user, temporary suspension, review account for abuse of AI resources",
      };

      this.anomalies.push(anomaly);
      await this.alertAnomaly(anomaly);
    }
  }

  /**
   * Detect API abuse patterns (legitimate user making unreasonable requests)
   */
  async detectAPIAbuse(
    userId: string,
    totalRequests: number,
    expectedDaily: number,
  ): Promise<void> {
    if (totalRequests > expectedDaily * 3) {
      // 3x expected daily usage in one day
      const anomaly: AnomalyPattern = {
        pattern: "api_abuse",
        description: `API abuse detected from user ${userId}. Requests: ${totalRequests}, Expected: ${expectedDaily}`,
        affectedIPs: [],
        affectedUsers: [userId],
        severity: "medium",
        detectedAt: Date.now(),
        recommendation:
          "Review API usage patterns, consider throttling AI features, contact user to understand usage",
      };

      this.anomalies.push(anomaly);
      await this.alertAnomaly(anomaly);
    }
  }

  /**
   * Critical alert - immediate action needed
   */
  private async alertCritical(violation: RateLimitViolation): Promise<void> {
    logger.error(`🚨 CRITICAL RATE LIMIT VIOLATION:`, {
      ip: violation.ip,
      userId: violation.userId,
      endpoint: violation.endpoint,
      violationCount: violation.count,
      timestamp: new Date(violation.timestamp).toISOString(),
    });

    // TODO: Send to monitoring service (Sentry, DataDog, etc.)
    await this.storeAlertInDB({
      type: "CRITICAL",
      message: `Rate limit violation from ${violation.ip} on ${violation.endpoint}`,
      data: violation,
      createdAt: new Date(),
    });
  }

  /**
   * High alert - investigate soon
   */
  private async alertHigh(violation: RateLimitViolation): Promise<void> {
    logger.warn(`⚠️ HIGH RATE LIMIT VIOLATION:`, {
      ip: violation.ip,
      userId: violation.userId,
      endpoint: violation.endpoint,
      violationCount: violation.count,
    });

    await this.storeAlertInDB({
      type: "HIGH",
      message: `High rate limit violation from ${violation.ip}`,
      data: violation,
      createdAt: new Date(),
    });
  }

  /**
   * Anomaly alert - security pattern detected
   */
  private async alertAnomaly(anomaly: AnomalyPattern): Promise<void> {
    logger.error(`🔴 ANOMALY DETECTED: ${anomaly.pattern.toUpperCase()}`, {
      pattern: anomaly.pattern,
      description: anomaly.description,
      affectedIPs: anomaly.affectedIPs,
      affectedUsers: anomaly.affectedUsers,
      recommendation: anomaly.recommendation,
    });

    await this.storeAlertInDB({
      type: "ANOMALY",
      message: anomaly.description,
      data: anomaly,
      createdAt: new Date(),
    });

    // TODO: Send to security team via email/Slack
  }

  /**
   * Store alerts for auditing and analysis
   */
  private async storeAlertInDB(alert: any): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) return;

      const key = `alerts:${Date.now()}`;
      await redis.set(key, JSON.stringify(alert), {
        EX: 30 * 24 * 60 * 60, // Keep for 30 days
      });

      // Also keep in a sorted set for recent alerts
      await redis.zAdd("recent_alerts", { score: Date.now(), value: key });
      await redis.zRemRangeByRank("recent_alerts", 0, -101); // Keep top 100
    } catch (error) {
      logger.error("Error storing alert in DB:", error);
    }
  }

  /**
   * Get recent security alerts
   */
  async getRecentAlerts(limit: number = 20): Promise<any[]> {
    try {
      const redis = getRedisClient();
      if (!redis) return [];

      const keys = (await redis.zRange("recent_alerts", 0, limit - 1, {
        REV: true,
      })) as string[];
      const alerts = [];

      for (const key of keys) {
        const alert = await redis.get(key);
        if (alert) {
          alerts.push(JSON.parse(alert));
        }
      }

      return alerts;
    } catch (error) {
      logger.error("Error retrieving alerts:", error);
      return [];
    }
  }

  /**
   * Get rate limit metrics for dashboard
   */
  async getMetrics(): Promise<{
    totalViolations: number;
    totalAnomalies: number;
    recentAlerts: any[];
    violationsBySeverity: Record<string, number>;
  }> {
    const violationsBySeverity = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const violation of this.violations.values()) {
      violationsBySeverity[violation.severity]++;
    }

    return {
      totalViolations: this.violations.size,
      totalAnomalies: this.anomalies.length,
      recentAlerts: await this.getRecentAlerts(10),
      violationsBySeverity,
    };
  }

  /**
   * Clear old violations (called periodically)
   */
  async clearOldViolations(): Promise<void> {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    for (const [key, violation] of this.violations.entries()) {
      if (violation.timestamp < oneHourAgo) {
        this.violations.delete(key);
      }
    }

    logger.info("Cleared old violations from monitor");
  }

  /**
   * Reset metrics (for testing or after resolving incident)
   */
  async resetMetrics(): Promise<void> {
    this.violations.clear();
    this.anomalies = [];
    logger.info("Rate limit monitor metrics reset");
  }
}

// Export singleton instance
export const rateLimitMonitor = new RateLimitMonitor();

/**
 * Start periodic monitoring tasks
 */
export function initializeMonitoring(): void {
  // Clear old violations every 30 minutes
  setInterval(
    () => {
      rateLimitMonitor.clearOldViolations();
    },
    30 * 60 * 1000,
  );

  logger.info("✅ Rate limit monitoring initialized");
}
