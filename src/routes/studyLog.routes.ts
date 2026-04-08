import { Router, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authenticate } from "../middleware/auth.middleware";
import { StudyLog } from "../models/StudyLog.model";
import { StudentProfile } from "../models/StudentProfile.model";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { studyLogRateLimiter } from "../middleware/rateLimiter.advanced";
import {
  validateStudyLogFields,
  normalizePagination,
  validateString,
} from "../utils/validators";

const router = Router();
router.use(authenticate);

router.post(
  "/",
  studyLogRateLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    // Validate all required fields
    const validation = validateStudyLogFields(req.body);
    if (!validation.valid) {
      throw createError(
        `Validation failed: ${JSON.stringify(validation.errors)}`,
        400,
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Create log with whitelisted, validated fields only
    const log = await StudyLog.create({
      userId: userObjectId,
      durationMinutes: validation.data.durationMinutes,
      scoreEarned: validation.data.scoreEarned,
      subject: validation.data.subject,
      topic: validation.data.topic,
      notes: validation.data.notes,
    });

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

    // Validate pagination parameters
    const { page, limit } = normalizePagination(
      req.query.page,
      req.query.limit,
    );

    // Validate and sanitize subject filter
    const filter: Record<string, unknown> = { userId: userObjectId };
    if (req.query.subject) {
      const subjectValidation = validateString(
        req.query.subject,
        "subject",
        2,
        50,
      );
      if (subjectValidation.valid) {
        filter.subject = subjectValidation.value;
      } else {
        throw createError("Invalid subject parameter", 400);
      }
    }

    const logs = await StudyLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    res.json({ success: true, data: logs });
  }),
);

export default router;
