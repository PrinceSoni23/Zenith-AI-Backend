import { createClient } from "redis";
import type { RedisClientType } from "redis";

/**
 * Redis Cache Service
 * Provides persistent, distributed cache across server instances
 * Survives server restarts (persisted to disk by Redis)
 * Perfect for multi-server deployments with 5000+ users
 */

class RedisCacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private readonly CACHE_PREFIX = "zenith:";

  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
      console.log(`[Redis] Connecting to ${redisUrl}...`);

      this.client = createClient({ url: redisUrl });

      this.client.on("error", (err: Error) => {
        console.error("[Redis] Client error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("[Redis] ✅ Connected successfully");
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error("[Redis] Failed to connect:", error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Generate cache key with prefix
   */
  private generateKey(agentType: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}=${JSON.stringify(params[k])}`)
      .join("&");

    return `${this.CACHE_PREFIX}${agentType}:${sortedParams}`;
  }

  /**
   * Set cache value with TTL
   * @param agentType Type of agent (e.g., "question-generator", "maths-solver")
   * @param params Parameters used in the request
   * @param value The cached value
   * @param ttlSeconds Time to live in seconds
   */
  async set<T>(
    agentType: string,
    params: Record<string, any>,
    value: T,
    ttlSeconds: number = 3600,
  ): Promise<void> {
    if (!this.isConnected || !this.client) {
      console.warn(
        "[Redis] Not connected, skipping cache set (data will be in memory only)",
      );
      return;
    }

    try {
      const key = this.generateKey(agentType, params);
      const serialized = JSON.stringify(value);

      await this.client.setEx(key, ttlSeconds, serialized);

      console.log(
        `[Redis] SET: ${key.substring(0, 50)}... (TTL: ${ttlSeconds}s)`,
      );
    } catch (error) {
      console.error("[Redis] Failed to set cache:", error);
    }
  }

  /**
   * Get cache value
   */
  async get<T>(
    agentType: string,
    params: Record<string, any>,
  ): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const key = this.generateKey(agentType, params);
      const cached = await this.client.get(key);

      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached);
      console.log(
        `[Redis] HIT: ${key.substring(0, 50)}... (${cached.length}B)`,
      );
      return parsed as T;
    } catch (error) {
      console.error("[Redis] Failed to get cache:", error);
      return null;
    }
  }

  /**
   * Check if key exists
   */
  async has(agentType: string, params: Record<string, any>): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const key = this.generateKey(agentType, params);
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error("[Redis] Failed to check existence:", error);
      return false;
    }
  }

  /**
   * Invalidate cache for specific agent type
   */
  async invalidateAgent(agentType: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const pattern = `${this.CACHE_PREFIX}${agentType}:*`;
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(
          `[Redis] INVALIDATED: ${agentType} (${keys.length} entries)`,
        );
      }
    } catch (error) {
      console.error("[Redis] Failed to invalidate agent:", error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const pattern = `${this.CACHE_PREFIX}*`;
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`[Redis] CLEARED all entries (${keys.length} keys)`);
      }
    } catch (error) {
      console.error("[Redis] Failed to clear cache:", error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    totalKeys: number;
    memoryUsage: string;
  }> {
    if (!this.isConnected || !this.client) {
      return { connected: false, totalKeys: 0, memoryUsage: "N/A" };
    }

    try {
      const pattern = `${this.CACHE_PREFIX}*`;
      const keys = await this.client.keys(pattern);
      const info = await this.client.info();

      // Parse memory usage from info
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : "Unknown";

      return {
        connected: true,
        totalKeys: keys.length,
        memoryUsage,
      };
    } catch (error) {
      console.error("[Redis] Failed to get stats:", error);
      return { connected: true, totalKeys: 0, memoryUsage: "Error" };
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log("[Redis] Disconnected");
    }
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const redisCacheService = new RedisCacheService();
