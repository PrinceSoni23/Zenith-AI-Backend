import { Router, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authenticate } from "../middleware/auth.middleware";
import { MathAttempt } from "../models/MathAttempt.model";
import { WeakTopic } from "../models/WeakTopic.model";
import { asyncHandler, createError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

router.post(
  "/solve",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const attempt = await MathAttempt.create({
      userId: userObjectId,
      ...req.body,
    });

    // Track as weak topic if wrong
    if (req.body.isCorrect === false && req.body.topic) {
      await WeakTopic.findOneAndUpdate(
        { userId: userObjectId, subject: "Mathematics", topic: req.body.topic },
        {
          $inc: { mistakeCount: 1 },
          needsRevision: true,
          lastAttempted: new Date(),
        },
        { upsert: true, new: true },
      );
    }

    res.status(201).json({ success: true, data: attempt });
  }),
);

router.get(
  "/history",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const attempts = await MathAttempt.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: attempts });
  }),
);

export default router;
