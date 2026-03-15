import { Router, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authenticate } from "../middleware/auth.middleware";
import { Note } from "../models/Note.model";
import { asyncHandler, createError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

router.post(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const note = await Note.create({ userId: userObjectId, ...req.body });
    res.status(201).json({ success: true, data: note });
  }),
);

router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { subject } = req.query;
    const filter: Record<string, unknown> = { userId: userObjectId };
    if (subject) filter.subject = subject;
    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: notes });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const note = await Note.findOne({
      _id: req.params.id,
      userId: userObjectId,
    });
    if (!note) throw createError("Note not found", 404);
    res.json({ success: true, data: note });
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: userObjectId },
      req.body,
      { new: true },
    );
    if (!note) throw createError("Note not found", 404);
    res.json({ success: true, data: note });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    await Note.findOneAndDelete({ _id: req.params.id, userId: userObjectId });
    res.json({ success: true, message: "Note deleted" });
  }),
);

export default router;
