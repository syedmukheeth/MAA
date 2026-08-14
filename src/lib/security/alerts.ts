import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/email";
import { securityAlertHtml } from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";
import { GRIEVANCE_OFFICER } from "@/lib/privacy/constants";
import { isAlertable } from "./events";
import type { SecurityEvent } from "@/generated/prisma/client";
import type { SecurityEventType } from "@/generated/prisma/enums";

/**
 * Turning detections into a message someone actually reads.
 *
 * The failure mode of every alerting system is the same one: an incident fires
 * five hundred times, the inbox becomes noise, and the next real alert is
 * ignored. So alerts are throttled per event type, and only HIGH and CRITICAL
 * events send anything at all — everything else is recorded for the dashboard
 * and the post-incident timeline.
 *
 * Alerts never contain personal data. The recipient is told what happened and
 * pointed at /admin/security; the identifying detail stays behind the login.
 * An alert email is an unencrypted message to a Gmail account, and a breach
 * notice that leaks the data it is warning about is its own incident.
 */

/** One alert per event type per hour. */
const ALERT_THROTTLE_SECONDS = 3600;

/** CRITICAL is rarer and more urgent, so it gets a shorter mute. */
const CRITICAL_THROTTLE_SECONDS = 900;

function throttleKey(type: SecurityEventType): string {
  return `security-alert:${type}`;
}

/**
 * Claims the right to send an alert for this type, returning false if one was
 * sent recently.
 *
 * Uses SET NX EX, so the check and the claim are one atomic operation — two
 * concurrent serverless invocations observing the same burst cannot both decide
 * they are the one to send.
 *
 * Fails OPEN: if Redis is unreachable we would rather send a duplicate alert
 * than silently drop the one telling you the database is being drained. This is
 * the opposite of the rate limiters, and deliberately so — there the risk is
 * unbounded brute force, here the risk is silence.
 */
async function claimAlertSlot(
  type: SecurityEventType,
  seconds: number
): Promise<boolean> {
  try {
    const result = await redis.set(throttleKey(type), Date.now(), {
      nx: true,
      ex: seconds,
    });
    return result === "OK";
  } catch {
    return true;
  }
}

/**
 * Sends an alert for an event if it warrants one and is not throttled.
 *
 * Best-effort throughout: this runs after the thing it is reporting has already
 * happened, and an alerting failure must not turn a detected incident into a
 * failed request.
 */
export async function maybeAlert(event: SecurityEvent | null): Promise<void> {
  if (!event || !isAlertable(event.severity)) return;

  try {
    const window =
      event.severity === "CRITICAL"
        ? CRITICAL_THROTTLE_SECONDS
        : ALERT_THROTTLE_SECONDS;

    if (!(await claimAlertSlot(event.type, window))) return;

    // How many of this type since the last alert — turns "one thing happened"
    // into "this is the 340th in an hour", which is the number that tells you
    // whether to get out of bed.
    const since = new Date(Date.now() - window * 1000);
    const occurrences = await prisma.securityEvent.count({
      where: { type: event.type, createdAt: { gte: since } },
    });

    const sent = await sendEmail({
      to: GRIEVANCE_OFFICER.email,
      subject: `[${event.severity}] MAA FURNITURE security alert: ${event.type}`,
      html: securityAlertHtml({
        severity: event.severity,
        eventType: event.type,
        summary: event.summary,
        occurrences,
        windowMinutes: Math.round(window / 60),
        dashboardUrl: `${getSiteUrl()}/admin/security`,
      }),
    });

    if (sent) {
      await prisma.securityEvent.update({
        where: { id: event.id },
        data: { alertedAt: new Date() },
      });
    }
  } catch (err) {
    console.error(
      `SECURITY ALERT FAILED [${event.type}] [${err instanceof Error ? err.name : "unknown"}]`
    );
  }
}
