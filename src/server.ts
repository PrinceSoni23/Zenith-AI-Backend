import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cron from "node-cron";
import { connectDB } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";
import { StudentProfile } from "./models/StudentProfile.model";
import { StudyLog } from "./models/StudyLog.model";
import { User } from "./models/User.model";
import { sendStreakWarningEmail } from "./services/streakEmail.service";

// Routes
import authRoutes from "./routes/auth.routes";
import agentRoutes from "./routes/agent.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import studyLogRoutes from "./routes/studyLog.routes";
import notesRoutes from "./routes/notes.routes";
import mathsRoutes from "./routes/maths.routes";
import questionRoutes from "./routes/question.routes";
import parentRoutes from "./routes/parent.routes";
import mentorRoutes from "./routes/mentor.routes";
import profileRoutes from "./routes/profile.routes";
import streakRoutes from "./routes/streak.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import migrationRoutes from "./routes/migration.routes";
import devRoutes from "./routes/dev.routes";
import { runWeeklyReset } from "./controllers/leaderboard.controller";
import {
  startPersonalPowerHourScheduler,
  resetMonthlySchedules,
} from "./services/powerHour.service";

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(rateLimiter);

// Body Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
app.use(
  morgan("combined", {
    stream: { write: message => logger.info(message.trim()) },
  }),
);

// Health Check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/study-logs", studyLogRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/maths", mathsRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/streak", streakRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/migration", migrationRoutes);
app.use("/api/dev", devRoutes);

// Global Error Handler
app.use(errorHandler);

// ── Streak Reminder Cron — fires every day at 19:00 (7 PM) ──────────────────
// Finds students with streak >= 3 who haven't studied today and emails them.
cron.schedule("0 19 * * *", async () => {
  logger.info("⏰ Running nightly streak check…");
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // All student profiles with an active streak
    const atRiskProfiles = await StudentProfile.find({
      streakDays: { $gte: 3 },
    })
      .select("userId streakDays")
      .lean();

    // Which users already studied today?
    const studiedTodayUserIds = await StudyLog.distinct("userId", {
      date: { $gte: todayStart },
    });
    const studiedSet = new Set(
      studiedTodayUserIds.map((id: unknown) => String(id)),
    );

    // Filter to only those who haven't studied
    const atRisk = atRiskProfiles.filter(
      p => !studiedSet.has(String(p.userId)),
    );

    if (atRisk.length === 0) {
      logger.info("✅ All streak students have already studied today");
      return;
    }

    // Fetch user details and send emails
    const userIds = atRisk.map(p => p.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select("name email")
      .lean();

    const userMap = new Map(users.map(u => [String(u._id), u]));

    let sent = 0;
    for (const profile of atRisk) {
      const user = userMap.get(String(profile.userId));
      if (!user) continue;
      await sendStreakWarningEmail({
        email: user.email,
        name: user.name.split(" ")[0],
        streak: profile.streakDays,
      });
      sent++;
    }
    logger.info(`📧 Streak reminder emails sent: ${sent}`);
  } catch (err) {
    logger.error("Streak cron job failed:", err);
  }
});

// ── Weekly Leaderboard Reset — every Monday at 00:01 ─────────────────────────
// Awards top-3 badges then resets all weeklyScores to 0.
cron.schedule("1 0 * * 1", async () => {
  logger.info("🏆 Running weekly leaderboard reset…");
  try {
    await runWeeklyReset();
    logger.info("✅ Weekly scores reset and badges awarded");
  } catch (err) {
    logger.error("Weekly reset cron failed:", err);
  }
});

// ── Monthly Power Hour Reset — 1st of every month at 00:00 ──────────────────
// Clears each user's locked-in time so they can pick a new one for the month.
cron.schedule("0 0 1 * *", async () => {
  logger.info("⚡ Running monthly Power Hour schedule reset…");
  try {
    const count = await resetMonthlySchedules();
    logger.info(`✅ Power Hour schedules cleared for ${count} users`);
  } catch (err) {
    logger.error("Monthly Power Hour reset failed:", err);
  }
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 AI Learning Companion Backend is live`);
    });

    // ── Start personal Power Hour scheduler (fires per-user time every minute) ──
    startPersonalPowerHourScheduler();
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
