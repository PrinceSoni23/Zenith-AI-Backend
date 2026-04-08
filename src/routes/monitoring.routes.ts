import { Router } from "express";
import {
  getRequestStats,
  resetRequestStats,
  getRedisStats,
} from "../controllers/monitoring.controller";
import { devEndpointLimiter } from "../middleware/rateLimiter.advanced";
import { authenticate } from "../middleware/auth.middleware";
import type { AuthRequest } from "../middleware/auth.middleware";
import { Response, NextFunction } from "express";

const router = Router();

/**
 * Admin-only middleware
 * Ensures only admin users can access monitoring endpoints
 */
function adminOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
    return;
  }
  next();
}

/**
 * Monitoring and Statistics Routes
 * Provides visibility into system performance and request tracking
 * Admin-only endpoints with strict rate limiting
 */

// Get request tracking statistics (admin only)
router.get(
  "/request-stats",
  authenticate,
  adminOnly,
  devEndpointLimiter,
  getRequestStats,
);

// Reset request statistics for testing (admin only)
router.post(
  "/request-stats/reset",
  authenticate,
  adminOnly,
  devEndpointLimiter,
  resetRequestStats,
);

// Get Redis cache statistics (admin only)
router.get(
  "/redis-stats",
  authenticate,
  adminOnly,
  devEndpointLimiter,
  getRedisStats,
);

export default router;
