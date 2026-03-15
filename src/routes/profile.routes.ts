import { Router, Response } from "express";
import { AuthRequest, authenticate } from "../middleware/auth.middleware";
import { StudentProfile } from "../models/StudentProfile.model";
import { asyncHandler, createError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await StudentProfile.findOne({ userId: req.user?.id });
    if (!profile) throw createError("Profile not found", 404);
    res.json({ success: true, data: profile });
  }),
);

router.put(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user?.id },
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!profile) throw createError("Profile not found", 404);
    res.json({ success: true, data: profile });
  }),
);

export default router;
