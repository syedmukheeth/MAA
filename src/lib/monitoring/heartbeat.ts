import { redis } from "@/lib/redis";

/**
 * Proof that the scheduled job is actually running.
 *
 * A cron that silently stops is the worst failure mode in this application: no
 * error is thrown, nothing appears in any log, and the only symptom is that
 * erasures customers requested never happen. Nobody notices until someone
 * checks — which is exactly the situation monitoring is supposed to remove.
 *
 * Stored in Redis rather than a table because it is one value that is
 * overwritten every run and never needs history. The TTL is deliberately
 * longer than the interval, so a missed run leaves a STALE marker rather than
 * an absent one, and "the job has never run" stays distinguishable from "the
 * job ran and then stopped".
 */
const HEARTBEAT_KEY = "heartbeat:nightly-cron";
const HEARTBEAT_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Runs are expected daily; beyond this the job is considered late. */
export const HEARTBEAT_STALE_AFTER_HOURS = 36;

export async function recordHeartbeat(): Promise<void> {
  try {
    await redis.set(HEARTBEAT_KEY, new Date().toISOString(), {
      ex: HEARTBEAT_TTL_SECONDS,
    });
  } catch {
    // Never fail the job for its own telemetry.
  }
}

export type HeartbeatStatus = {
  state: "ok" | "stale" | "never" | "unknown";
  lastRunAt: string | null;
  hoursSince: number | null;
};

export async function readHeartbeat(): Promise<HeartbeatStatus> {
  try {
    const value = await redis.get<string>(HEARTBEAT_KEY);
    if (!value) {
      return { state: "never", lastRunAt: null, hoursSince: null };
    }
    const last = new Date(value);
    const hoursSince = (Date.now() - last.getTime()) / 3_600_000;
    return {
      state: hoursSince > HEARTBEAT_STALE_AFTER_HOURS ? "stale" : "ok",
      lastRunAt: value,
      hoursSince: Math.round(hoursSince),
    };
  } catch {
    // Redis being unreachable is itself worth surfacing, but it is not evidence
    // the cron failed — so it gets its own state rather than being reported as
    // a missed run.
    return { state: "unknown", lastRunAt: null, hoursSince: null };
  }
}
