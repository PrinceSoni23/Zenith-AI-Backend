import { createClient } from "redis";
import type { RedisClientType } from "redis";
import { logger } from "../utils/logger";

let redisClient: RedisClientType | null = null;

/**
 * Initialize and export Redis client for rate limiting
 * Uses the same connection as redis.cache.service
 */
export async function initializeRedisClient(): Promise<RedisClientType | null> {
  try {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      logger.warn(
        "[Redis Rate Limit] REDIS_URL not configured - rate limiting will use in-memory store",
      );
      return null;
    }

    redisClient = createClient({ url: redisUrl });

    redisClient.on("error", err => {
      logger.error("[Redis Rate Limit] Connection error:", err);
    });

    redisClient.on("connect", () => {
      logger.info("[Redis Rate Limit] Connected successfully");
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error("[Redis Rate Limit] Failed to initialize:", error);
    return null;
  }
}

/**
 * Get the Redis client instance
 * Returns the singleton client or null if not connected
 */
export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

// Initialize on module load
initializeRedisClient().catch(err => {
  logger.error("Failed to initialize Redis for rate limiting:", err);
});

export { redisClient };
