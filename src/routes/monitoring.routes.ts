import { Router } from "express";
import {
  getRequestStats,
  resetRequestStats,
} from "../controllers/monitoring.controller";

const router = Router();

/**
 * Monitoring and Statistics Routes
 * Provides visibility into system performance and request tracking
 */

// Get request tracking statistics
router.get("/request-stats", getRequestStats);

// Reset request statistics (for testing)
router.post("/request-stats/reset", resetRequestStats);

export default router;
