import { maybeAlert } from "./alerts";
import {
  recordFailedLogin,
  recordSecurityEvent,
  checkSuspiciousLoginSuccess,
  type SecurityEventInput,
} from "./events";

/**
 * The surface every caller should use: detect, record, and alert in one call.
 *
 * Exists so that `events.ts` (which records and detects) never has to import
 * `alerts.ts` (which reads events to decide whether to alert). Composing them
 * here rather than having them call each other keeps the dependency acyclic —
 * detectors stay testable without a mail transport, and alerting stays testable
 * without a detector.
 *
 * Every function is fire-and-forget by contract. Nothing here throws, and no
 * caller should let a security-telemetry failure break the request it was
 * observing.
 */

/** Records an event and alerts if it is severe enough and not throttled. */
export async function reportSecurityEvent(
  input: SecurityEventInput
): Promise<void> {
  const event = await recordSecurityEvent(input);
  await maybeAlert(event);
}

/**
 * Call on every failed sign-in. Records the attempt, then alerts if it has
 * tipped into credential stuffing or password spraying.
 */
export async function reportFailedLogin(params: {
  ip: string | null;
  userId: string | null;
}): Promise<void> {
  const escalations = await recordFailedLogin(params);
  for (const event of escalations) await maybeAlert(event);
}

/**
 * Call on every successful sign-in. Silent unless the success followed a burst
 * of failures, which is the strongest single signal of an account takeover.
 */
export async function reportLoginSuccess(params: {
  ip: string | null;
  userId: string;
}): Promise<void> {
  const escalations = await checkSuspiciousLoginSuccess(params);
  for (const event of escalations) await maybeAlert(event);
}

export {
  EVENT_SEVERITY,
  isAlertable,
  compareSeverity,
  hashIp,
  STUFFING_THRESHOLD,
  STUFFING_WINDOW_MINUTES,
  SPRAYING_THRESHOLD,
  SPRAYING_WINDOW_MINUTES,
  TAKEOVER_THRESHOLD,
  TAKEOVER_LOOKBACK_MINUTES,
} from "./events";
