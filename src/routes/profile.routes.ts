import { Router, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authenticate } from "../middleware/auth.middleware";
import { StudentProfile } from "../models/StudentProfile.model";
import { asyncHandler, createError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const profile = await StudentProfile.findOne({ userId: userObjectId });
    if (!profile) throw createError("Profile not found", 404);
    res.json({ success: true, data: profile });
  }),
);

router.put(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: userObjectId },
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!profile) throw createError("Profile not found", 404);
    res.json({ success: true, data: profile });
  }),
);

export default router;
