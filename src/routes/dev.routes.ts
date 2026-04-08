import { Router } from "express";
import {
  createDummyStudent,
  clearDummyData,
} from "../controllers/dev.controller";
import { devEndpointLimiter } from "../middleware/rateLimiter.advanced";

const router = Router();

// Development-only endpoints - Strict rate limiting
router.post("/create-dummy-student", devEndpointLimiter, createDummyStudent);
router.post("/clear-dummy-data", devEndpointLimiter, clearDummyData);

export default router;
