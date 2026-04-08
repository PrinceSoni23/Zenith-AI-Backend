import { Router, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authenticate } from "../middleware/auth.middleware";
import { Note } from "../models/Note.model";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { notesRateLimiter } from "../middleware/rateLimiter.advanced";
import { validateNoteFields, validateString } from "../utils/validators";

const router = Router();
router.use(authenticate);

router.post(
  "/",
  notesRateLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    // Validate fields
    const validation = validateNoteFields(req.body);
    if (!validation.valid) {
      throw createError(
        `Validation failed: ${JSON.stringify(validation.errors)}`,
        400,
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const note = await Note.create({
      userId: userObjectId,
      title: validation.data.title,
      content: validation.data.content,
      subject: validation.data.subject,
    });
    res.status(201).json({ success: true, data: note });
  }),
);

router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter: Record<string, unknown> = { userId: userObjectId };

    // Validate subject filter if provided
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

    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: notes });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw createError("Invalid note ID format", 400);
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const note = await Note.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw createError("Invalid note ID format", 400);
    }

    // Validate fields before update
    const validation = validateNoteFields(req.body);
    if (!validation.valid) {
      throw createError(
        `Validation failed: ${JSON.stringify(validation.errors)}`,
        400,
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const note = await Note.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.params.id),
        userId: userObjectId,
      },
      {
        title: validation.data.title,
        content: validation.data.content,
        subject: validation.data.subject,
      },
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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw createError("Invalid note ID format", 400);
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await Note.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(req.params.id),
      userId: userObjectId,
    });
    if (!result) throw createError("Note not found", 404);
    res.json({ success: true, message: "Note deleted" });
  }),
);

export default router;
