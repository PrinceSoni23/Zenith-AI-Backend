import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/errorHandler";
import { requestTracker } from "../services/requestTracker.service";

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
