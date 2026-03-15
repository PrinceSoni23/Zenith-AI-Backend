import { Router } from "express";
import {
  getStreakData,
  getDailyMissions,
  completeTask,
} from "../controllers/streak.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  setPersonalPowerHour,
  getPersonalSchedule,
} from "../services/powerHour.service";

const router = Router();

router.use(authenticate);

router.get("/", getStreakData);
router.get("/missions", getDailyMissions);
router.post("/missions/:taskId/complete", completeTask);

// ── Personal Power Hour schedule ──────────────────────────────────────────────

/**
 * GET /api/streak/power-hour/schedule
 * Returns the user's current Power Hour preference for this month.
 */
router.get("/power-hour/schedule", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const schedule = await getPersonalSchedule(userId);
    res.json({ success: true, data: schedule });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch schedule" });
  }
});

/**
 * POST /api/streak/power-hour/schedule
 * Body: { hour: 20, minute: 0 }   (24-h format, e.g. 20:00 = 8 PM)
 * Once per month — returns error if already set this month.
 */
router.post("/power-hour/schedule", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { hour, minute } = req.body as { hour: number; minute: number };

    if (
      typeof hour !== "number" ||
      hour < 0 ||
      hour > 23 ||
      typeof minute !== "number" ||
      minute < 0 ||
      minute > 59
    ) {
      res
        .status(400)
        .json({ success: false, message: "Invalid hour or minute" });
      return;
    }

    const result = await setPersonalPowerHour(userId, hour, minute);
    if (!result.ok) {
      res.status(409).json({ success: false, message: result.reason });
      return;
    }
    res.json({
      success: true,
      message: `⚡ Power Hour locked in at ${result.time} every day this month!`,
      time: result.time,
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to set schedule" });
  }
});

export default router;
