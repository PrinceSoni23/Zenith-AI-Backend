import { Router } from "express";
import {
  createDummyStudent,
  clearDummyData,
} from "../controllers/dev.controller";

const router = Router();

// Development-only endpoints
router.post("/create-dummy-student", createDummyStudent);
router.post("/clear-dummy-data", clearDummyData);

export default router;
