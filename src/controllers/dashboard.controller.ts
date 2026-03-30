import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { StudentProfile } from "../models/StudentProfile.model";
import { StudyLog } from "../models/StudyLog.model";
import { Task } from "../models/Task.model";
import { WeakTopic } from "../models/WeakTopic.model";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { redisCacheService } from "../services/redis.cache.service";
import { logger } from "../utils/logger";

/**
 * Optimized dashboard endpoint:
 * - Paginates data to reduce load
 * - Caches stats for 5 minutes
 * - Returns data faster on repeat visits
 */
export const getDashboard = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(10, parseInt(req.query.limit as string) || 5);

    // Check cache for stats (these don't change often)
    const cachedStats = await redisCacheService.get(`dashboard-stats`, {
      userId,
    });

    // ── Fetch profile and recent data in parallel ──
    const [profile, recentLogs, pendingTasks, weakTopics, weeklyLogsCached] =
      await Promise.all([
        StudentProfile.findOne({ userId: userObjectId }),
        StudyLog.find({ userId: userObjectId })
          .sort({ createdAt: -1 })
          .limit(limit * page)
          .lean(),
        Task.find({ userId: userObjectId, isCompleted: false })
          .sort({ priority: -1 })
          .limit(limit * page)
          .lean(),
        WeakTopic.find({ userId: userObjectId, needsRevision: true })
          .limit(limit)
          .lean(),
        // Only fetch weekly logs if not cached
        cachedStats
          ? Promise.resolve(null)
          : StudyLog.find({
              userId: userObjectId,
              createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            }).lean(),
      ]);

    // Calculate weekly stats (with caching)
    interface WeeklyStats {
      weeklyMinutes: number;
      weeklyScore: number;
      subjectBreakdown: Record<string, number>;
    }

    let weeklyStats: WeeklyStats | null = (cachedStats as WeeklyStats) || null;
    if (!weeklyStats && weeklyLogsCached) {
      const weeklyMinutes = weeklyLogsCached.reduce(
        (sum, log) => sum + (log.durationMinutes || 0),
        0,
      );
      const weeklyScore = weeklyLogsCached.reduce(
        (sum, log) => sum + (log.scoreEarned || 0),
        0,
      );

      // Subject breakdown
      const subjectBreakdown: Record<string, number> = {};
      weeklyLogsCached.forEach(log => {
        subjectBreakdown[log.subject] =
          (subjectBreakdown[log.subject] || 0) + (log.durationMinutes || 0);
      });

      weeklyStats = {
        weeklyMinutes,
        weeklyScore,
        subjectBreakdown,
      };

      // Cache stats for 5 minutes
      await redisCacheService.set(
        `dashboard-stats`,
        { userId },
        weeklyStats,
        300,
      );
      logger.info(`[Dashboard] Cached stats for user ${userId}`);
    }

    // Paginate results
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;

    res.json({
      success: true,
      data: {
        profile,
        stats: {
          streakDays: profile?.streakDays || 0,
          studyScore: profile?.studyScore || 0,
          totalStudyMinutes: profile?.totalStudyMinutes || 0,
          weeklyMinutes: weeklyStats?.weeklyMinutes || 0,
          weeklyScore: weeklyStats?.weeklyScore || 0,
          badges: profile?.badges || [],
        },
        recentActivity: recentLogs.slice(startIdx, endIdx),
        pendingTasks: pendingTasks.slice(startIdx, endIdx),
        weakTopics,
        subjectBreakdown: weeklyStats?.subjectBreakdown || {},
        pagination: {
          page,
          limit,
          hasMore: recentLogs.length > endIdx,
        },
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
