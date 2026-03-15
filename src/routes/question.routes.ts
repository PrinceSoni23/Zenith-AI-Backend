import { Router, Response } from "express";
import { AuthRequest, authenticate } from "../middleware/auth.middleware";
import { GeneratedQuestion } from "../models/GeneratedQuestion.model";
import { asyncHandler, createError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

router.post(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);
    const questionSet = await GeneratedQuestion.create({ userId, ...req.body });
    res.status(201).json({ success: true, data: questionSet });
  }),
);

router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { subject, topic } = req.query;
    const filter: Record<string, unknown> = { userId };
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    const questions = await GeneratedQuestion.find(filter)
      .sort({ generatedAt: -1 })
      .limit(10);
    res.json({ success: true, data: questions });
  }),
);

export default router;
