/**
 * Request Tracker Service
 * Tracks total AI requests per server session
 * Resets to 0 when server restarts
 */

interface RequestStats {
  totalRequests: number;
  requestsByAgent: Record<string, number>;
  cacheHits: number;
  cacheMisses: number;
  serverStartTime: Date;
  uptime: string;
}

class RequestTrackerService {
  private totalRequests: number = 0;
  private requestsByAgent: Record<string, number> = {};
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private serverStartTime: Date;

  constructor() {
    this.serverStartTime = new Date();
    console.log(
      "[RequestTracker] Service initialized at",
      this.serverStartTime,
    );
  }

  /**
   * Increment total request count
   */
  trackRequest(agentType: string, isCacheHit: boolean): void {
    this.totalRequests++;

    // Track per-agent requests
    if (!this.requestsByAgent[agentType]) {
      this.requestsByAgent[agentType] = 0;
    }
    this.requestsByAgent[agentType]++;

    // Track cache hits vs misses
    if (isCacheHit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    console.log(
      `[RequestTracker] Request #${this.totalRequests} - Agent: ${agentType}, Cache: ${isCacheHit ? "HIT" : "MISS"}`,
    );
  }

  /**
   * Get current statistics
   */
  getStats(): RequestStats {
    const uptime = this.calculateUptime();

    return {
      totalRequests: this.totalRequests,
      requestsByAgent: this.requestsByAgent,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      serverStartTime: this.serverStartTime,
      uptime,
    };
  }

  /**
   * Calculate server uptime
   */
  private calculateUptime(): string {
    const now = new Date();
    const diff = now.getTime() - this.serverStartTime.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get cache hit rate percentage
   */
  getCacheHitRate(): number {
    if (this.totalRequests === 0) return 0;
    return Math.round((this.cacheHits / this.totalRequests) * 100);
  }

  /**
   * Reset stats (for testing)
   */
  reset(): void {
    this.totalRequests = 0;
    this.requestsByAgent = {};
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.serverStartTime = new Date();
    console.log("[RequestTracker] Stats reset");
  }
}

// Export singleton instance
export const requestTracker = new RequestTrackerService();
