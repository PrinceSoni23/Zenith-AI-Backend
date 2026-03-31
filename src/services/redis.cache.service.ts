import { createClient } from "redis";
import type { RedisClientType } from "redis";
import { normalizeParams } from "../utils/inputNormalization";

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

  // In-memory cache fallback when Redis is not available
  private inMemoryCache = new Map<string, { value: any; expiresAt: number }>();

  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL;

      // If REDIS_URL is empty or not set, skip Redis (use in-memory cache only)
      if (!redisUrl) {
        console.warn(
          "[Redis] ⚠️ REDIS_URL not configured - using in-memory cache (will reset on restart)",
        );
        this.isConnected = false;
        return;
      }

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

      // Start cleanup interval for in-memory cache
      this.startInMemoryCleanup();
    } catch (error) {
      console.warn(
        "[Redis] ⚠️ Failed to connect - using in-memory cache only",
        error instanceof Error ? error.message : error,
      );
      this.isConnected = false;
      // Start cleanup interval for in-memory cache
      this.startInMemoryCleanup();
      // Don't throw - allow graceful fallback to in-memory cache
    }
  }

  /**
   * Generate cache key with prefix
   * Normalizes string parameters for consistent caching across case/whitespace variations
   */
  private generateKey(agentType: string, params: Record<string, any>): string {
    // Normalize all string parameters to ensure consistent cache keys
    // Handles: "Photosynthesis" vs "photosynthesis" vs "photosynthesis " are all treated the same
    const normalizedParams = normalizeParams(params);

    const sortedParams = Object.keys(normalizedParams)
      .sort()
      .map(k => `${k}=${JSON.stringify(normalizedParams[k])}`)
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
    const key = this.generateKey(agentType, params);

    if (!this.isConnected || !this.client) {
      // Fallback: Store in in-memory cache
      const expiresAt = Date.now() + ttlSeconds * 1000;
      this.inMemoryCache.set(key, { value, expiresAt });
      console.log(
        `[Cache] IN-MEMORY SET: ${key.substring(0, 50)}... (TTL: ${ttlSeconds}s)`,
      );
      return;
    }

    try {
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
    const key = this.generateKey(agentType, params);

    // Check in-memory cache first (if Redis not connected)
    if (!this.isConnected || !this.client) {
      const cached = this.inMemoryCache.get(key);

      if (!cached) {
        return null;
      }

      // Check if expired
      if (Date.now() > cached.expiresAt) {
        this.inMemoryCache.delete(key);
        return null;
      }

      console.log(`[Cache] IN-MEMORY HIT: ${key.substring(0, 50)}...`);
      return cached.value as T;
    }

    try {
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
   * Clean up expired entries from in-memory cache
   * Runs periodically to prevent memory leaks
   */
  private startInMemoryCleanup(): void {
    // Run cleanup every 5 minutes
    setInterval(
      () => {
        const now = Date.now();
        let deletedCount = 0;

        for (const [key, entry] of this.inMemoryCache.entries()) {
          if (now > entry.expiresAt) {
            this.inMemoryCache.delete(key);
            deletedCount++;
          }
        }

        if (deletedCount > 0) {
          console.log(
            `[Cache] IN-MEMORY CLEANUP: Removed ${deletedCount} expired entries (${this.inMemoryCache.size} remaining)`,
          );
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes
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
