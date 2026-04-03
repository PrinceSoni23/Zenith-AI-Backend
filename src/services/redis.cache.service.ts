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

    const key = `${this.CACHE_PREFIX}${agentType}:${sortedParams}`;

    // Debug logging for cache key generation
    console.log(
      `[Redis Cache Key] Agent: ${agentType}, Topic: "${normalizedParams.topic}", Subject: "${normalizedParams.subject}"`,
    );
    console.log(
      `[Redis Cache Key] Full key (first 100 chars): ${key.substring(0, 100)}...`,
    );

    return key;
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
   * 🎯 BACKEND SIMILARITY SEARCH - Shared across ALL users!
   *
   * When Student B searches "photns" and Student A cached "photons"
   * This finds the similar cached response so Student B gets ZERO API cost
   *
   * Example flow:
   *  Student A: "photons" → AI call → cached in Redis
   *  Student B: "photns" → Exact cache miss → Similarity search → FOUND! → Zero API cost
   */
  async findSimilarCachedResponse<T>(
    agentType: string,
    topic: string,
  ): Promise<{ response: T; cachedTopic: string; similarity: number } | null> {
    if (!topic || topic.trim().length === 0) return null;

    const topicLower = topic.toLowerCase().trim();
    let bestMatch: {
      response: T;
      cachedTopic: string;
      similarity: number;
      key: string;
    } | null = null;

    try {
      // Get all keys for this agent type from Redis
      const pattern = `${this.CACHE_PREFIX}${agentType}:*`;
      const keys = (await this.client?.keys(pattern)) || [];

      for (const key of keys) {
        try {
          const cached = await this.client?.get(key);
          if (!cached) continue;

          // Extract topic from cache key
          // Key format: "zenith:agent-type:topic={value}&other={value}"
          const topicMatch = key.match(/topic=([^&]+)/);
          if (!topicMatch) continue;

          try {
            const cachedTopic = JSON.parse(decodeURIComponent(topicMatch[1]));
            if (!cachedTopic || typeof cachedTopic !== "string") continue;

            // Calculate similarity
            const similarity = this.calculateSimilarity(
              topicLower,
              cachedTopic.toLowerCase(),
            );

            // Accept matches > 70% similar
            if (similarity > 0.7) {
              const parsed = JSON.parse(cached) as T;
              if (!bestMatch || similarity > bestMatch.similarity) {
                bestMatch = {
                  response: parsed,
                  cachedTopic,
                  similarity,
                  key,
                };
              }
            }
          } catch (e) {
            continue;
          }
        } catch (e) {
          continue;
        }
      }

      if (bestMatch !== null) {
        console.log(
          `[Backend Cache] SIMILARITY HIT: "${topic}" → "${bestMatch.cachedTopic}" (${Math.round(bestMatch.similarity * 100)}% match) - SHARED ACROSS ALL USERS!`,
        );
        return {
          response: bestMatch.response,
          cachedTopic: bestMatch.cachedTopic,
          similarity: bestMatch.similarity,
        };
      }
    } catch (error) {
      console.error("[Redis] Similarity search error:", error);
    }

    return null;
  }

  /**
   * Calculate similarity between two strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;

    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;

    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = Array(len2 + 1)
      .fill(null)
      .map(() => Array(len1 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }

    return matrix[len2][len1];
  }

  /**
   * Get all cached topics for an agent (for debugging)
   */
  async getAllCachedTopics(agentType: string): Promise<string[]> {
    const topics: string[] = [];

    try {
      const pattern = `${this.CACHE_PREFIX}${agentType}:*`;
      const keys = (await this.client?.keys(pattern)) || [];

      for (const key of keys) {
        const topicMatch = key.match(/topic=([^&]+)/);
        if (topicMatch) {
          try {
            const topic = JSON.parse(decodeURIComponent(topicMatch[1]));
            if (topic && typeof topic === "string") {
              topics.push(topic);
            }
          } catch (e) {
            // Skip parsing errors
          }
        }
      }
    } catch (error) {
      console.error("[Redis] Failed to get all topics:", error);
    }

    return topics;
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
