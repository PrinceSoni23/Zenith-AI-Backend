import { Router } from "express";
import {
  getDashboard,
  updateProfile,
} from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  dashboardRateLimiter,
  profileUpdateRateLimiter,
} from "../middleware/rateLimiter.advanced";

const router = Router();

router.use(authenticate);
router.get("/", dashboardRateLimiter, getDashboard);
router.put("/profile", profileUpdateRateLimiter, updateProfile);

export default router;
