import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

// ── Transporter ───────────────────────────────────────────────────────────────

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Fall back to Ethereal (development catch-all) so the server never crashes
    logger.warn(
      "⚠️  SMTP env vars not set — streak emails will be swallowed by Ethereal",
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// ── HTML Template ─────────────────────────────────────────────────────────────

function buildStreakEmail(name: string, streak: number): string {
  const milestoneMsg =
    streak >= 30
      ? "You're in the top 1% of students. Legendary status."
      : streak >= 14
        ? "Two-week warrior! You're building a real habit."
        : streak >= 7
          ? "A full week of learning — that's impressive!"
          : streak >= 3
            ? "Three days in and going strong!"
            : "Your streak is alive. Keep it that way!";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your streak ends tonight</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="520" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#161b22;border-radius:20px;overflow:hidden;border:1px solid #21262d;">

          <!-- Header gradient bar -->
          <tr>
            <td style="height:6px;background:linear-gradient(90deg,#f97316,#ef4444,#ec4899);"></td>
          </tr>

          <!-- Fire emoji hero -->
          <tr>
            <td align="center" style="padding:40px 40px 20px;">
              <div style="font-size:64px;line-height:1;">🔥</div>
              <h1 style="margin:16px 0 8px;font-size:26px;font-weight:800;color:#f0f6fc;letter-spacing:-0.5px;">
                Don't break your ${streak}-day streak!
              </h1>
              <p style="margin:0;font-size:15px;color:#8b949e;line-height:1.6;">
                ${milestoneMsg}
              </p>
            </td>
          </tr>

          <!-- Streak counter pill -->
          <tr>
            <td align="center" style="padding:0 40px 32px;">
              <div style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#f97316,#ef4444);border-radius:50px;">
                <span style="font-size:28px;font-weight:900;color:#fff;">
                  🔥 ${streak} days
                </span>
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#21262d;"></div>
            </td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 12px;font-size:15px;color:#c9d1d9;line-height:1.7;">
                Hey ${name} 👋
              </p>
              <p style="margin:0 0 12px;font-size:15px;color:#c9d1d9;line-height:1.7;">
                You haven't studied yet today. Your <strong style="color:#f97316;">${streak}-day streak</strong> will
                reset at midnight if you don't complete at least one task.
              </p>
              <p style="margin:0;font-size:15px;color:#c9d1d9;line-height:1.7;">
                Even 10 minutes counts. Open your dashboard, knock out one mission, and
                keep that streak alive. 💪
              </p>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td align="center" style="padding:0 40px 40px;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard"
                 style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
                        border-radius:14px;font-size:16px;font-weight:700;color:#fff;
                        text-decoration:none;letter-spacing:0.2px;">
                Study Now →
              </a>
            </td>
          </tr>

          <!-- Mission reminder -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background:#1f2937;border-radius:14px;padding:20px;border:1px solid #374151;">
                <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.8px;">
                  Today's Quick Mission
                </p>
                <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.6;">
                  Complete 1 task in your dashboard — takes as little as 10 minutes.
                  Your streak is worth protecting. 🎯
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#484f58;line-height:1.6;">
                You're receiving this because your streak is at risk.<br/>
                <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/profile"
                   style="color:#484f58;text-decoration:underline;">Manage notifications</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface StreakWarningPayload {
  email: string;
  name: string;
  streak: number;
}

export async function sendStreakWarningEmail({
  email,
  name,
  streak,
}: StreakWarningPayload): Promise<void> {
  const transporter = createTransporter();

  if (!transporter) {
    // Dev mode: create a temporary Ethereal account and log the preview URL
    try {
      const testAccount = await nodemailer.createTestAccount();
      const devTransport = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      const info = await devTransport.sendMail({
        from: `"StudyAI" <noreply@studyai.app>`,
        to: email,
        subject: `🔥 Your ${streak}-day streak ends tonight, ${name}!`,
        html: buildStreakEmail(name, streak),
      });
      logger.info(
        `📧 Dev streak email sent → ${nodemailer.getTestMessageUrl(info)}`,
      );
    } catch (err) {
      logger.error("Failed to send dev streak email:", err);
    }
    return;
  }

  try {
    await transporter.sendMail({
      from: `"StudyAI" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `🔥 Your ${streak}-day streak ends tonight, ${name}!`,
      html: buildStreakEmail(name, streak),
    });
    logger.info(`📧 Streak warning email sent to ${email} (streak=${streak})`);
  } catch (err) {
    // Never crash the server over a notification
    logger.error(`Failed to send streak email to ${email}:`, err);
  }
}
