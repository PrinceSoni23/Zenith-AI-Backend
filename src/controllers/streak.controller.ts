import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { StudentProfile } from "../models/StudentProfile.model";
import { StudyLog } from "../models/StudyLog.model";
import { Task } from "../models/Task.model";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { isPowerHourActive } from "../services/powerHour.service";

// ── helpers ──────────────────────────────────────────────────────────────────

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfDayUTC(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/**
 * Recalculates the streak from study logs and updates the profile.
 * Returns the new streak count.
 */
export async function recalcStreak(userId: string): Promise<number> {
  const logs = await StudyLog.find({ userId })
    .sort({ date: -1 })
    .select("date")
    .lean();

  if (logs.length === 0) {
    await StudentProfile.findOneAndUpdate({ userId }, { streakDays: 0 });
    return 0;
  }

  // Build set of unique study dates (YYYY-MM-DD)
  const studyDates = new Set(
    logs.map(l => startOfDayUTC(new Date(l.date)).toISOString().slice(0, 10)),
  );

  const today = startOfDayUTC(new Date());
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - 86400000)
    .toISOString()
    .slice(0, 10);

  // Streak is only alive if student studied today OR yesterday
  let streak = 0;
  const hasToday = studyDates.has(todayStr);
  const hasYesterday = studyDates.has(yesterdayStr);

  if (!hasToday && !hasYesterday) {
    // ── Shield protection: consume 1 shield instead of resetting ─────────────
    const profile = await StudentProfile.findOne({ userId })
      .select("streakShields streakDays")
      .lean();

    if (profile && profile.streakShields > 0 && (profile.streakDays ?? 0) > 0) {
      // Inject a ghost "yesterday" study log so the streak walk-back still works
      await StudyLog.create({
        userId,
        subject: "Shield",
        topic: "Streak Freeze (auto)",
        moduleUsed: "streak-shield",
        durationMinutes: 0,
        date: new Date(today.getTime() - 86400000), // yesterday
        scoreEarned: 0,
        completedTasks: [],
      });
      // Deduct the shield
      await StudentProfile.findOneAndUpdate(
        { userId },
        { $inc: { streakShields: -1 } },
      );
      // Re-run with the injected log
      return recalcStreak(userId);
    }

    await StudentProfile.findOneAndUpdate({ userId }, { streakDays: 0 });
    return 0;
  }

  // Walk back from most recent active day
  let cursor = hasToday ? today : new Date(today.getTime() - 86400000);
  while (true) {
    const curStr = cursor.toISOString().slice(0, 10);
    if (studyDates.has(curStr)) {
      streak++;
      cursor = new Date(cursor.getTime() - 86400000);
    } else {
      break;
    }
  }

  await StudentProfile.findOneAndUpdate({ userId }, { streakDays: streak });
  return streak;
}

// ── GET /api/streak ───────────────────────────────────────────────────────────

export const getStreakData = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const streak = await recalcStreak(userId);
    const profile = await StudentProfile.findOne({ userId })
      .select(
        "studyScore powerHourEnds powerHourTime powerHourSetMonth streakShields",
      )
      .lean();

    // Last 7 days activity map
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentLogs = await StudyLog.find({
      userId,
      date: { $gte: sevenDaysAgo },
    })
      .select("date")
      .lean();

    const activityMap: Record<string, boolean> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      activityMap[startOfDay(d).toISOString().slice(0, 10)] = false;
    }
    recentLogs.forEach(log => {
      const key = startOfDay(new Date(log.date)).toISOString().slice(0, 10);
      if (key in activityMap) activityMap[key] = true;
    });

    // Did the student study today?
    const todayStart = startOfDay(new Date());
    const studiedToday = await StudyLog.exists({
      userId,
      date: { $gte: todayStart },
    });

    res.json({
      success: true,
      data: {
        streakDays: streak,
        studyScore: profile?.studyScore || 0,
        studiedToday: !!studiedToday,
        last7Days: activityMap,
        nextMilestone:
          streak < 3
            ? 3
            : streak < 7
              ? 7
              : streak < 14
                ? 14
                : streak < 30
                  ? 30
                  : streak + 7,
        xpToday: recentLogs.length > 0 ? recentLogs.length * 10 : 0,
        powerHourEnds: profile?.powerHourEnds ?? null,
        powerHourActive: isPowerHourActive(profile?.powerHourEnds),
        // Personal schedule info
        powerHourTime: profile?.powerHourTime ?? null,
        powerHourSetThisMonth:
          profile?.powerHourSetMonth === new Date().getMonth() + 1,
        streakShields: profile?.streakShields ?? 0,
      },
    });
  },
);

// ── GET /api/streak/missions ──────────────────────────────────────────────────

export const getDailyMissions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const todayStart = startOfDay(new Date());

    // Get today's AI-generated tasks, max 3
    let missions = await Task.find({
      userId,
      generatedByAI: true,
      dueDate: { $gte: todayStart },
    })
      .sort({ priority: -1 })
      .limit(3)
      .lean();

    // Fallback: get any pending tasks
    if (missions.length === 0) {
      missions = await Task.find({ userId, isCompleted: false })
        .sort({ priority: -1 })
        .limit(3)
        .lean();
    }

    const totalXP = missions.reduce((sum, t) => sum + (t.scoreReward || 10), 0);
    const completedCount = missions.filter(t => t.isCompleted).length;

    res.json({
      success: true,
      data: {
        missions,
        totalXP,
        completedCount,
        allDone: completedCount === missions.length && missions.length > 0,
      },
    });
  },
);

// ── POST /api/streak/missions/:taskId/complete ────────────────────────────────

export const completeTask = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const { taskId } = req.params;

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      { isCompleted: true, completedAt: new Date() },
      { new: true },
    );

    if (!task) throw createError("Task not found", 404);

    // Check power hour multiplier
    const profile = await StudentProfile.findOne({ userId })
      .select("powerHourEnds")
      .lean();
    const multiplierActive = isPowerHourActive(profile?.powerHourEnds);
    const baseXP = task.scoreReward || 10;
    const xpEarned = multiplierActive ? baseXP * 2 : baseXP;

    // Award XP
    await StudentProfile.findOneAndUpdate(
      { userId },
      {
        $inc: {
          studyScore: xpEarned,
          weeklyScore: xpEarned,
        },
      },
    );

    // Log a study entry so streak counts this day
    const alreadyLoggedToday = await StudyLog.exists({
      userId,
      date: { $gte: startOfDay(new Date()) },
    });

    if (!alreadyLoggedToday) {
      await StudyLog.create({
        userId,
        subject: task.subject,
        topic: task.title,
        moduleUsed: "daily-mission",
        durationMinutes: task.estimatedMinutes,
        date: new Date(),
        scoreEarned: xpEarned,
        completedTasks: [task.title],
      });
    }

    const newStreak = await recalcStreak(userId);

    // ── Award a streak shield at every 7-day milestone ────────────────────────
    const wasOnMilestone = newStreak > 0 && newStreak % 7 === 0;
    if (wasOnMilestone) {
      await StudentProfile.findOneAndUpdate(
        { userId },
        { $inc: { streakShields: 1 } },
      );
    }

    res.json({
      success: true,
      data: {
        task,
        xpEarned,
        multiplierActive,
        baseXP,
        newStreak,
        shieldEarned: wasOnMilestone,
        message: wasOnMilestone
          ? `🛡️ Shield earned! ${newStreak}-day milestone! ${multiplierActive ? `⚡ ${xpEarned} XP (2×)` : `+${xpEarned} XP`}`
          : multiplierActive
            ? `⚡ ${xpEarned} XP (2× Power Hour!) ${newStreak >= 3 ? `🔥 ${newStreak}-day streak!` : "Keep it up!"}`
            : newStreak >= 7
              ? `🔥 ${newStreak}-day streak! You're unstoppable!`
              : newStreak >= 3
                ? `🔥 ${newStreak} days in a row! Keep going!`
                : "✅ Task complete! Great work!",
      },
    });
  },
);
