import { Router } from "express";
import { getLeaderboard } from "../controllers/leaderboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import { leaderboardRateLimiter } from "../middleware/rateLimiter.advanced";

const router = Router();
router.use(authenticate);
router.get("/", leaderboardRateLimiter, getLeaderboard);

export default router;
