import { Router, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authenticate } from "../middleware/auth.middleware";
import { StudyLog } from "../models/StudyLog.model";
import { StudentProfile } from "../models/StudentProfile.model";
import { asyncHandler, createError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

router.post(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const log = await StudyLog.create({ userId: userObjectId, ...req.body });

    // Update student's total study time and score
    await StudentProfile.findOneAndUpdate(
      { userId: userObjectId },
      {
        $inc: {
          totalStudyMinutes: log.durationMinutes,
          studyScore: log.scoreEarned,
        },
        lastStudyDate: new Date(),
      },
    );

    res.status(201).json({ success: true, data: log });
  }),
);

router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { limit = 20, page = 1, subject } = req.query;

    const filter: Record<string, unknown> = { userId: userObjectId };
    if (subject) filter.subject = subject;

    const logs = await StudyLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({ success: true, data: logs });
  }),
);

export default router;
