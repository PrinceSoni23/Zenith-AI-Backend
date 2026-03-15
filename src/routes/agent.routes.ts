import { Router } from "express";
import { dispatchAgent, getDailyFlow } from "../controllers/agent.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

// Central agent dispatcher — all AI modules call this
router.post("/dispatch", dispatchAgent);

// Daily flow: mentor message + study plan
router.get("/daily-flow", getDailyFlow);

export default router;
