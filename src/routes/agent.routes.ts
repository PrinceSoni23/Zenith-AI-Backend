import { Router } from "express";
import {
  dispatchAgent,
  getDailyFlow,
  getFreshDailyFlow,
} from "../controllers/agent.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

// Central agent dispatcher — all AI modules call this
router.post("/dispatch", dispatchAgent);

// Daily flow: mentor message + study plan (cached, 30 min TTL)
router.get("/daily-flow", getDailyFlow);

// Force refresh daily flow (bypasses cache)
router.post("/daily-flow/refresh", getFreshDailyFlow);

export default router;
