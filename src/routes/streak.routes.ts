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
import { validateTime } from "../utils/validators";
import {
  questionsRateLimiter,
  profileUpdateRateLimiter,
} from "../middleware/rateLimiter.advanced";

const router = Router();

router.use(authenticate);

router.get("/", questionsRateLimiter, getStreakData);
router.get("/missions", questionsRateLimiter, getDailyMissions);
router.post("/missions/:taskId/complete", questionsRateLimiter, completeTask);

// ── Personal Power Hour schedule ──────────────────────────────────────────────

/**
 * GET /api/streak/power-hour/schedule
 * Returns the user's current Power Hour preference for this month.
 */
router.get("/power-hour/schedule", questionsRateLimiter, async (req, res) => {
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
router.post(
  "/power-hour/schedule",
  profileUpdateRateLimiter,
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { hour, minute } = req.body;

      // Use shared validation utility
      const timeValidation = validateTime(hour, minute);
      if (!timeValidation.valid) {
        res.status(400).json({ success: false, message: timeValidation.error });
        return;
      }

      const { hour: validHour, minute: validMinute } = timeValidation.value || {
        hour,
        minute,
      };

      const result = await setPersonalPowerHour(userId, validHour, validMinute);
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
      res
        .status(500)
        .json({ success: false, message: "Failed to set schedule" });
    }
  },
);

export default router;
