import { StudentProfile } from "../models/StudentProfile.model";
import { logger } from "../utils/logger";

// ── Pure helpers ──────────────────────────────────────────────────────────────

/** Returns true if the given powerHourEnds date is still in the future. */
export function isPowerHourActive(powerHourEnds?: Date): boolean {
  if (!powerHourEnds) return false;
  return powerHourEnds.getTime() > Date.now();
}

// ── Personal schedule ─────────────────────────────────────────────────────────

/**
 * Lets a student lock in their personal Power Hour time for this month.
 * Rules:
 *  - Only allowed once per calendar month (enforced here; caller should also check).
 *  - Stores "HH:MM" and the current month (1-12).
 *  - Does NOT immediately activate; the daily scheduler will fire it at the right time.
 */
export async function setPersonalPowerHour(
  userId: string,
  hour: number, // 0-23
  minute: number, // 0-59
): Promise<{ ok: true; time: string } | { ok: false; reason: string }> {
  const profile = await StudentProfile.findOne({ userId }).select(
    "powerHourSetMonth powerHourTime",
  );
  if (!profile) return { ok: false, reason: "Profile not found" };

  const currentMonth = new Date().getMonth() + 1; // 1-12
  if (profile.powerHourSetMonth === currentMonth) {
    return {
      ok: false,
      reason: `You already set your Power Hour to ${profile.powerHourTime} this month. It resets on the 1st.`,
    };
  }

  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  await StudentProfile.updateOne(
    { userId },
    { $set: { powerHourTime: time, powerHourSetMonth: currentMonth } },
  );
  logger.info(
    `⚡ User ${userId} locked Power Hour at ${time} for month ${currentMonth}`,
  );
  return { ok: true, time };
}

/**
 * Returns the user's current Power Hour preference for display.
 */
export async function getPersonalSchedule(userId: string) {
  const profile = await StudentProfile.findOne({ userId })
    .select("powerHourTime powerHourSetMonth powerHourEnds")
    .lean();
  if (!profile) return null;

  const currentMonth = new Date().getMonth() + 1;
  const isSetThisMonth = profile.powerHourSetMonth === currentMonth;

  // Days left in this month
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = lastDay - now.getDate();

  return {
    time: isSetThisMonth ? (profile.powerHourTime ?? null) : null,
    setThisMonth: isSetThisMonth,
    daysLeftInMonth: daysLeft,
    powerHourActive: isPowerHourActive(
      profile.powerHourEnds as Date | undefined,
    ),
    powerHourEnds: profile.powerHourEnds ?? null,
  };
}

// ── Activation helpers ────────────────────────────────────────────────────────

/** Activates a 60-minute Power Hour for a single user right now. */
export async function activatePowerHourForUser(userId: string): Promise<Date> {
  const ends = new Date(Date.now() + 60 * 60 * 1000);
  await StudentProfile.updateOne({ userId }, { $set: { powerHourEnds: ends } });
  return ends;
}

/** Activates a 60-minute Power Hour for ALL students right now. */
export async function activatePowerHourForAll(): Promise<number> {
  const ends = new Date(Date.now() + 60 * 60 * 1000);
  const result = await StudentProfile.updateMany(
    {},
    { $set: { powerHourEnds: ends } },
  );
  logger.info(
    `⚡ Power Hour activated for ${result.modifiedCount} students — ends ${ends.toISOString()}`,
  );
  return result.modifiedCount;
}

// ── Monthly reset ─────────────────────────────────────────────────────────────

/**
 * Called by the monthly cron (1st of every month at 00:00).
 * Clears powerHourTime + powerHourSetMonth so every user can pick a new slot.
 */
export async function resetMonthlySchedules(): Promise<number> {
  const result = await StudentProfile.updateMany(
    {},
    { $unset: { powerHourTime: "", powerHourSetMonth: "" } },
  );
  logger.info(
    `⚡ Monthly Power Hour schedules reset for ${result.modifiedCount} users`,
  );
  return result.modifiedCount;
}

// ── Daily scheduler ───────────────────────────────────────────────────────────

/**
 * Fires every minute and checks if any user's personal Power Hour time
 * matches the current HH:MM.  For users without a personal preference,
 * falls back to the global random window (fired once per day).
 *
 * Call once from startServer(); it self-perpetuates via setInterval.
 */
export function startPersonalPowerHourScheduler(): void {
  // Check every 60 seconds
  setInterval(async () => {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const currentMonth = now.getMonth() + 1;

    // Find all students whose personal time matches RIGHT NOW this month
    const profiles = await StudentProfile.find({
      powerHourTime: hhmm,
      powerHourSetMonth: currentMonth,
    }).select("userId");

    if (profiles.length === 0) return;

    const ends = new Date(Date.now() + 60 * 60 * 1000);
    const ids = profiles.map(p => p.userId);
    await StudentProfile.updateMany(
      { userId: { $in: ids } },
      { $set: { powerHourEnds: ends } },
    );
    logger.info(
      `⚡ Personal Power Hour fired at ${hhmm} for ${ids.length} user(s)`,
    );
  }, 60 * 1000); // every minute

  logger.info("⚡ Personal Power Hour scheduler started (checks every minute)");
}

/**
 * @deprecated  Use startPersonalPowerHourScheduler() instead.
 * Kept for backward compatibility — picks a random server-wide time each day.
 */
export function scheduleDailyPowerHour(minHour = 8, maxHour = 21): Date {
  const now = new Date();
  const todayBase = new Date(now);
  todayBase.setSeconds(0, 0);

  const totalMinutes = (maxHour - minHour) * 60;
  const offsetMinutes = Math.floor(Math.random() * totalMinutes);
  const fireHour = minHour + Math.floor(offsetMinutes / 60);
  const fireMinute = offsetMinutes % 60;

  todayBase.setHours(fireHour, fireMinute, 0, 0);
  if (todayBase.getTime() <= Date.now()) {
    todayBase.setDate(todayBase.getDate() + 1);
    todayBase.setHours(fireHour, fireMinute, 0, 0);
  }

  const msUntilFire = todayBase.getTime() - Date.now();
  setTimeout(async () => {
    try {
      await activatePowerHourForAll();
    } catch (err) {
      logger.error("Power Hour activation failed:", err);
    }
    scheduleDailyPowerHour(minHour, maxHour);
  }, msUntilFire);

  logger.info(
    `⚡ Global fallback Power Hour scheduled for ${todayBase.toLocaleTimeString()} (in ${Math.round(msUntilFire / 60000)} min)`,
  );
  return todayBase;
}
