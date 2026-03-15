import { Router } from "express";
import { getLeaderboard } from "../controllers/leaderboard.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticate);
router.get("/", getLeaderboard);

export default router;
