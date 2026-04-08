import { Router } from "express";
import {
  register,
  login,
  getMe,
  changePassword,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  authRateLimiter,
  passwordChangeLimiter,
} from "../middleware/rateLimiter.advanced";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.get("/me", authenticate, getMe);
router.put(
  "/change-password",
  authenticate,
  passwordChangeLimiter,
  changePassword,
);

export default router;
