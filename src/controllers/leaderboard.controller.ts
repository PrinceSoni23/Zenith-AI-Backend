import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { StudentProfile } from "../models/StudentProfile.model";
import { User } from "../models/User.model";
import { asyncHandler, createError } from "../middleware/errorHandler";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the date of the most recent Monday at 00:00:00 local time */
function lastMonday(): Date {
  const d = new Date();
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? 6 : day - 1; // days since last Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** ms until next Monday 00:00:00 */
function msUntilReset(): number {
  const now = Date.now();
  const nextMon = lastMonday();
  nextMon.setDate(nextMon.getDate() + 7);
  return nextMon.getTime() - now;
}

// ── GET /api/leaderboard ──────────────────────────────────────────────────────
//
//  Returns top-50 students for the calling user's board + classLevel, ordered
//  by weeklyScore descending. Also returns the caller's own rank and entry.

export const getLeaderboard = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    // Fetch caller's profile to scope the leaderboard
    const myProfile = await StudentProfile.findOne({ userId }).lean();
    if (!myProfile) throw createError("Profile not found", 404);

    const { board, classLevel } = myProfile;

    // All profiles in the same board + classLevel, sorted by weeklyScore
    const profiles = await StudentProfile.find({ board, classLevel })
      .sort({ weeklyScore: -1, studyScore: -1 })
      .select("userId weeklyScore studyScore streakDays badges")
      .lean();

    if (profiles.length === 0) {
      res.json({
        success: true,
        data: {
          entries: [],
          myRank: 1,
          resetIn: msUntilReset(),
          board,
          classLevel,
        },
      });
      return;
    }

    // Fetch user names
    const userIds = profiles.map(p => p.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select("name")
      .lean();
    const nameMap = new Map(users.map(u => [String(u._id), u.name]));

    // Build ranked entries (top 50 displayed)
    const entries = profiles.slice(0, 50).map((p, i) => ({
      rank: i + 1,
      userId: String(p.userId),
      name: nameMap.get(String(p.userId)) || "Student",
      weeklyScore: p.weeklyScore || 0,
      totalScore: p.studyScore || 0,
      streakDays: p.streakDays || 0,
      badges: p.badges || [],
      isMe: String(p.userId) === String(userId),
      medal: i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null,
    }));

    // Caller's rank (may be outside top 50)
    const myRankIndex = profiles.findIndex(
      p => String(p.userId) === String(userId),
    );
    const myRank = myRankIndex === -1 ? profiles.length + 1 : myRankIndex + 1;

    // My entry (always included even if outside top 50)
    const myEntry =
      myRankIndex !== -1
        ? {
            rank: myRank,
            userId: String(userId),
            name: nameMap.get(String(userId)) || "You",
            weeklyScore: myProfile.weeklyScore || 0,
            totalScore: myProfile.studyScore || 0,
            streakDays: myProfile.streakDays || 0,
            badges: myProfile.badges || [],
            isMe: true,
            medal:
              myRank <= 3
                ? myRank === 1
                  ? "🥇"
                  : myRank === 2
                    ? "🥈"
                    : "🥉"
                : null,
          }
        : null;

    res.json({
      success: true,
      data: {
        entries,
        myRank,
        myEntry,
        totalParticipants: profiles.length,
        resetIn: msUntilReset(), // ms
        board,
        classLevel,
        weekStart: lastMonday().toISOString(),
      },
    });
  },
);

// ── Exported helper — used by Monday cron ────────────────────────────────────

/**
 * Resets weeklyScore to 0 for everyone and awards top-3 badges.
 * Called by the Monday 00:01 cron job.
 */
export async function runWeeklyReset(): Promise<void> {
  // Find top-3 in every board+classLevel group
  const groups = await StudentProfile.aggregate([
    { $sort: { weeklyScore: -1 } },
    {
      $group: {
        _id: { board: "$board", classLevel: "$classLevel" },
        top: { $push: { userId: "$userId", weeklyScore: "$weeklyScore" } },
      },
    },
  ]);

  const badgeUpdates: Promise<unknown>[] = [];

  for (const group of groups) {
    const top = (group.top as { userId: string; weeklyScore: number }[]).slice(
      0,
      3,
    );
    const medals = [
      "🥇 Weekly Champion",
      "🥈 Weekly Runner-up",
      "🥉 Weekly Third",
    ];
    top.forEach((entry, i) => {
      if ((entry.weeklyScore || 0) > 0) {
        badgeUpdates.push(
          StudentProfile.findOneAndUpdate(
            { userId: entry.userId },
            { $addToSet: { badges: medals[i] } },
          ),
        );
      }
    });
  }

  await Promise.all(badgeUpdates);

  // Reset all weeklyScores
  await StudentProfile.updateMany({}, { $set: { weeklyScore: 0 } });
}
