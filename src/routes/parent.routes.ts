import { Router, Response } from "express";
import {
  AuthRequest,
  authenticate,
  authorize,
} from "../middleware/auth.middleware";
import { ParentAccess } from "../models/ParentAccess.model";
import { StudentProfile } from "../models/StudentProfile.model";
import { StudyLog } from "../models/StudyLog.model";
import { WeakTopic } from "../models/WeakTopic.model";
import { asyncHandler, createError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

// Link parent to student
router.post(
  "/link",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parentUserId = req.user?.id;
    const { studentUserId, relationship } = req.body;
    const link = await ParentAccess.create({
      parentUserId,
      studentUserId,
      relationship,
    });
    res.status(201).json({ success: true, data: link });
  }),
);

// Get child's insights (parent only)
router.get(
  "/insights/:studentId",
  authorize("parent", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parentUserId = req.user?.id;
    const { studentId } = req.params;

    const access = await ParentAccess.findOne({
      parentUserId,
      studentUserId: studentId,
      isApproved: true,
    });
    if (!access) throw createError("Access denied or not approved", 403);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [profile, studyLogs, weakTopics] = await Promise.all([
      StudentProfile.findOne({ userId: studentId }),
      StudyLog.find({ userId: studentId, createdAt: { $gte: weekAgo } }),
      WeakTopic.find({ userId: studentId, needsRevision: true }),
    ]);

    res.json({
      success: true,
      data: { profile, studyLogs, weakTopics },
    });
  }),
);

// Get all linked students for this parent
router.get(
  "/students",
  authorize("parent", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parentUserId = req.user?.id;
    const links = await ParentAccess.find({
      parentUserId,
      isApproved: true,
    }).populate("studentUserId", "name email");
    const students = links.map((l: any) => ({
      id: (l.studentUserId as any)._id,
      name: (l.studentUserId as any).name,
      email: (l.studentUserId as any).email,
    }));
    res.json({ success: true, data: students });
  }),
);

export default router;
