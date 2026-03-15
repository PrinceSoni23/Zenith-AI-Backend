import { Router } from "express";
import {
  getDashboard,
  updateProfile,
} from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.get("/", getDashboard);
router.put("/profile", updateProfile);

export default router;
