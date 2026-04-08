import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getRedisClient } from "../config/redis.config";
import { logger } from "../utils/logger";
import { Request } from "express";

interface RateLimitRequest extends Request {
  user?: { id: string; role: string; email: string };
  rateLimit?: { resetTime: number };
}

/**
 * Get role-based rate limit based on user role
 * Premium/Pro users get higher limits
 * Incentivizes monetization while protecting system
 */
export function getRoleBasedLimit(role: string): number {
  const limits: Record<string, number> = {
    free: 30, // Base limit: 30 req/hour
    premium: 100, // Premium: 100 req/hour
    pro: 200, // Pro: 200 req/hour
    mentor: 50, // Mentors can check more student data
    parent: 40, // Parents: reasonable checking
    admin: 0, // Admin: unlimited
  };
  return limits[role] || 30;
}

/**
 * Create a custom rate limiter for specific endpoints
 * Allows per-endpoint customization
 */
export function createEndpointLimiter(
  prefix: string,
  options: {
    windowMs?: number;
    max?: number;
    keyGenerator?: (req: any) => string;
    useUserId?: boolean;
  } = {},
) {
  const {
    windowMs = 60 * 60 * 1000, // Default: 1 hour
    max = 50,
    useUserId = true,
  } = options;

  const redisClient = getRedisClient();

  return rateLimit({
    store: redisClient
      ? new RedisStore({
          // @ts-ignore - rate-limit-redis expects client property
          client: redisClient,
          prefix: `${prefix}:`,
        } as any)
      : undefined,
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: req => {
      const rateLimitReq = req as RateLimitRequest;
      // If useUserId is true and user is authenticated, use userId + endpoint
      if (useUserId && rateLimitReq.user?.id) {
        return `${rateLimitReq.user.id}:${rateLimitReq.path}`;
      }
      return rateLimitReq.ip || "unknown";
    },
    message: {
      success: false,
      message: "Rate limit exceeded. Please try again later.",
    },
    handler: (req, res) => {
      const rateLimitReq = req as RateLimitRequest;
      logger.warn(
        `Rate limit exceeded - Prefix: ${prefix}, User: ${rateLimitReq.user?.id || rateLimitReq.ip}, Path: ${rateLimitReq.path}`,
      );
      res.status(429).json({
        success: false,
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: rateLimitReq.rateLimit?.resetTime,
      });
    },
  });
}

/**
 * Create a time-based sliding window rate limiter
 * Uses Redis for persistence across server restarts
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const redisClient = getRedisClient();

  if (!redisClient) {
    // Fallback: allow request if Redis not available
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: Date.now() + windowMs,
    };
  }

  const redisKey = `sliding:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Remove old entries outside the window
    await redisClient.zRemRangeByScore(redisKey, 0, windowStart);

    // Count requests in current window
    const requestCount = (await redisClient.zCard(redisKey)) || 0;

    if (requestCount >= maxRequests) {
      // Get the oldest request to calculate when limit resets
      const oldestRequest = await redisClient.zRange(redisKey, 0, 0);
      const resetTime = oldestRequest?.[0]
        ? parseInt(oldestRequest[0]) + windowMs
        : now + windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }

    // Add current request
    await redisClient.zAdd(redisKey, { score: now, value: now.toString() });
    await redisClient.expire(redisKey, Math.ceil(windowMs / 1000));

    return {
      allowed: true,
      remaining: maxRequests - requestCount - 1,
      resetTime: now + windowMs,
    };
  } catch (error) {
    logger.error("Error checking rate limit:", error);
    // On Redis error, allow request but log it
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: now + windowMs,
    };
  }
}

/**
 * Adaptive rate limiting based on system load
 * If CPU/Memory usage is high, tighten limits
 * If load is low, relax limits slightly to improve UX
 */
export function getAdaptiveLimit(
  baseLimit: number,
  systemLoad: number, // 0-1, where 1 is 100% capacity
): number {
  if (systemLoad > 0.9) {
    // Critical load: reduce limit by 50%
    return Math.floor(baseLimit * 0.5);
  }
  if (systemLoad > 0.75) {
    // High load: reduce by 25%
    return Math.floor(baseLimit * 0.75);
  }
  if (systemLoad < 0.3) {
    // Low load: increase limit by 20% for better UX
    return Math.floor(baseLimit * 1.2);
  }
  return baseLimit;
}

/**
 * Temporarily whitelist an IP for testing (admin only)
 */
export async function whitelistIP(
  ip: string,
  durationMs: number = 24 * 60 * 60 * 1000,
): Promise<void> {
  const redisClient = getRedisClient();
  if (!redisClient) return;

  const key = `whitelist:${ip}`;
  await redisClient.set(key, "1", {
    EX: Math.ceil(durationMs / 1000),
  });
  logger.info(`IP ${ip} whitelisted for ${durationMs}ms`);
}

/**
 * Temporarily blacklist an IP (suspected attacker)
 */
export async function blacklistIP(
  ip: string,
  durationMs: number = 24 * 60 * 60 * 1000,
): Promise<void> {
  const redisClient = getRedisClient();
  if (!redisClient) return;

  const key = `blacklist:${ip}`;
  await redisClient.set(key, "1", {
    EX: Math.ceil(durationMs / 1000),
  });
  logger.warn(`IP ${ip} blacklisted for ${durationMs}ms`);
}

/**
 * Check if IP is whitelisted
 */
export async function isIPWhitelisted(ip: string): Promise<boolean> {
  const redisClient = getRedisClient();
  if (!redisClient) return false;

  const key = `whitelist:${ip}`;
  const result = await redisClient.get(key);
  return result !== null;
}

/**
 * Check if IP is blacklisted
 */
export async function isIPBlacklisted(ip: string): Promise<boolean> {
  const redisClient = getRedisClient();
  if (!redisClient) return false;

  const key = `blacklist:${ip}`;
  const result = await redisClient.get(key);
  return result !== null;
}

/**
 * Get rate limit stats for monitoring/analytics
 */
export async function getRateLimitStats(prefix: string): Promise<any> {
  const redisClient = getRedisClient();
  if (!redisClient) return null;

  try {
    // Get all keys matching the prefix pattern
    const pattern = `${prefix}:*`;
    const keys = await redisClient.keys(pattern);

    if (keys.length === 0) {
      return {
        prefix,
        totalKeys: 0,
        totalRequests: 0,
      };
    }

    const stats = {
      prefix,
      totalKeys: keys.length,
      topUsers: [] as any[],
    };

    // Get top 10 users by request count
    for (const key of keys.slice(0, 100)) {
      const count = await redisClient.get(key);
      if (count) {
        stats.topUsers.push({
          key,
          requests: parseInt(count),
        });
      }
    }

    stats.topUsers.sort((a, b) => b.requests - a.requests);
    stats.topUsers = stats.topUsers.slice(0, 10);

    return stats;
  } catch (error) {
    logger.error("Error getting rate limit stats:", error);
    return null;
  }
}

/**
 * Reset rate limit for a specific user (admin action)
 * Useful for legitimate users who hit the limit by accident
 */
export async function resetUserRateLimit(
  userId: string,
  prefix?: string,
): Promise<void> {
  const redisClient = getRedisClient();
  if (!redisClient) return;

  if (prefix) {
    const key = `${prefix}:${userId}*`;
    const keys = await redisClient.keys(key);
    for (const k of keys) {
      await redisClient.del(k);
    }
    logger.info(`Rate limit reset for user ${userId} on prefix ${prefix}`);
  } else {
    // Reset all limiters for this user
    const pattern = `*:${userId}*`;
    const keys = await redisClient.keys(pattern);
    for (const k of keys) {
      if (k.includes("sliding") || k.includes("rl:")) {
        await redisClient.del(k);
      }
    }
    logger.info(`Rate limit reset for user ${userId} across all prefixes`);
  }
}
