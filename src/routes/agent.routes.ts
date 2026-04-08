import { Router } from "express";
import {
  dispatchAgent,
  getDailyFlow,
  getFreshDailyFlow,
} from "../controllers/agent.controller";
import { authenticate } from "../middleware/auth.middleware";
import { aiAgentRateLimiter } from "../middleware/rateLimiter.advanced";

const router = Router();

router.use(authenticate);

// Central agent dispatcher — all AI modules call this
// Rate limited to prevent abuse of expensive AI operations
router.post("/dispatch", aiAgentRateLimiter, dispatchAgent);

// Daily flow: mentor message + study plan (cached, 30 min TTL)
// Lower rate limited
router.get("/daily-flow", aiAgentRateLimiter, getDailyFlow);

// Force refresh daily flow (bypasses cache)
// Rate limited to prevent cache busting attacks
router.post("/daily-flow/refresh", aiAgentRateLimiter, getFreshDailyFlow);

export default router;
