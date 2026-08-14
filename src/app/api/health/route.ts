import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { readHeartbeat } from "@/lib/monitoring/heartbeat";

/**
 * Health check for an external uptime monitor.
 *
 * Deliberately reports THREE states, not two. A binary up/down check only
 * catches total outages, and the failures that actually happen here are
 * partial: the site renders fine while Redis is down and rate limiting has
 * silently failed open, or while the nightly cron has stopped and erasures
 * customers requested are quietly not happening.
 *
 *   200 ok       — everything healthy
 *   200 degraded — serving traffic, but something needs attention
 *   503 error    — the database is unreachable; the site cannot function
 *
 * Point an external pinger at this URL and alert on 503 **and** on a body
 * containing "degraded". See docs/privacy/11-monitoring.md — an external
 * checker is required because a self-hosted one cannot report that the host it
 * runs on is down.
 *
 * No authentication: an uptime monitor cannot hold a credential, and the
 * response deliberately contains no personal data, no counts, and no version
 * or dependency information that would help an attacker.
 */
export const dynamic = "force-dynamic";

type CheckState = "ok" | "error" | "unknown";

async function checkDatabase(): Promise<CheckState> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
}

async function checkRedis(): Promise<CheckState> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  if (!url || url.includes("localhost")) return "unknown";
  try {
    await redis.ping();
    return "ok";
  } catch {
    return "error";
  }
}

export async function GET() {
  const [database, cache, heartbeat] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    readHeartbeat(),
  ]);

  // The database is the only hard dependency. Without it nothing works, so it
  // is the only thing that produces a 503.
  const isDown = database === "error";

  // Everything else degrades rather than fails. Redis down means rate limiting
  // has fallen back to the in-memory limiter; a stale heartbeat means scheduled
  // erasures are not running. Both are serious and neither stops the shop.
  const isDegraded =
    cache === "error" ||
    heartbeat.state === "stale" ||
    heartbeat.state === "never";

  const status = isDown ? "error" : isDegraded ? "degraded" : "ok";

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database,
        cache,
        scheduledJobs: heartbeat.state,
        hoursSinceLastJobRun: heartbeat.hoursSince,
      },
    },
    { status: isDown ? 503 : 200 }
  );
}
