import { Router } from "express";
import {
  register,
  login,
  getMe,
  changePassword,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { strictRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", strictRateLimiter, register);
router.post("/login", strictRateLimiter, login);
router.get("/me", authenticate, getMe);
router.put("/change-password", authenticate, changePassword);

export default router;
