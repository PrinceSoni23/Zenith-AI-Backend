import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/errorHandler";
import { requestTracker } from "../services/requestTracker.service";
import { redisCacheService } from "../services/redis.cache.service";

/**
 * Get request tracking statistics
 * Shows total requests, cache hits/misses, uptime, etc.
 */
export const getRequestStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const stats = requestTracker.getStats();
    const hitRate = requestTracker.getCacheHitRate();

    res.json({
      success: true,
      data: {
        ...stats,
        cacheHitRate: `${hitRate}%`,
      },
    });
  },
);

/**
 * Reset request statistics (for testing only)
 */
export const resetRequestStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // Optional: Add authentication check to prevent unauthorized resets
    requestTracker.reset();

    res.json({
      success: true,
      message: "Request statistics reset",
      data: requestTracker.getStats(),
    });
  },
);

/**
 * Get Redis cache statistics
 * Shows number of keys, memory usage, etc.
 */
export const getRedisStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const redisStats = await redisCacheService.getStats();

      res.json({
        success: true,
        data: {
          isConnected: redisCacheService.isReady(),
          ...redisStats,
        },
      });
    } catch (error) {
      res.json({
        success: false,
        data: {
          isConnected: false,
          keyCount: 0,
          memoryUsage: "N/A",
          message: "Redis not available - using in-memory cache",
        },
      });
    }
  },
);
