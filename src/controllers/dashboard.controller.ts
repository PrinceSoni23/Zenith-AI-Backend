import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { StudentProfile } from "../models/StudentProfile.model";
import { StudyLog } from "../models/StudyLog.model";
import { Task } from "../models/Task.model";
import { WeakTopic } from "../models/WeakTopic.model";
import { asyncHandler, createError } from "../middleware/errorHandler";

export const getDashboard = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const [profile, recentLogs, pendingTasks, weakTopics] = await Promise.all([
      StudentProfile.findOne({ userId: userObjectId }),
      StudyLog.find({ userId: userObjectId }).sort({ createdAt: -1 }).limit(5),
      Task.find({ userId: userObjectId, isCompleted: false })
        .sort({ priority: -1 })
        .limit(5),
      WeakTopic.find({ userId: userObjectId, needsRevision: true }).limit(5),
    ]);

    // Calculate weekly stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyLogs = await StudyLog.find({
      userId: userObjectId,
      createdAt: { $gte: weekAgo },
    });

    const weeklyMinutes = weeklyLogs.reduce(
      (sum, log) => sum + log.durationMinutes,
      0,
    );
    const weeklyScore = weeklyLogs.reduce(
      (sum, log) => sum + log.scoreEarned,
      0,
    );

    // Subject breakdown
    const subjectBreakdown: Record<string, number> = {};
    weeklyLogs.forEach(log => {
      subjectBreakdown[log.subject] =
        (subjectBreakdown[log.subject] || 0) + log.durationMinutes;
    });

    res.json({
      success: true,
      data: {
        profile,
        stats: {
          streakDays: profile?.streakDays || 0,
          studyScore: profile?.studyScore || 0,
          totalStudyMinutes: profile?.totalStudyMinutes || 0,
          weeklyMinutes,
          weeklyScore,
          badges: profile?.badges || [],
        },
        recentActivity: recentLogs,
        pendingTasks,
        weakTopics,
        subjectBreakdown,
      },
    });
  },
);

export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const updates = req.body;
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: userObjectId },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!profile) throw createError("Profile not found", 404);

    res.json({ success: true, data: profile });
  },
);
