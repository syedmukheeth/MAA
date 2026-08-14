import { headers } from "next/headers";
import type { Ratelimit } from "@upstash/ratelimit";

/**
 * Shared rate-limit plumbing.
 *
 * Extracted from actions/auth.ts when the DPDP privacy actions needed the same
 * guarantees — a second copy of the fail-closed fallback would have drifted
 * from the first the moment either was tuned.
 */

export async function clientIp(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * In-memory sliding-window fallback store.
 *
 * If Upstash Redis is unreachable or out of quota, `.limit()` rejects.
 * To prevent authentication from failing open into unbounded brute-force,
 * this fallback enforces local rate limits per Node instance during outages.
 */
const fallbackStore = new Map<string, { count: number; resetAt: number }>();
const FALLBACK_WINDOW_MS = 60 * 1000;
const FALLBACK_MAX_ATTEMPTS = 10;

function checkInMemoryFallback(key: string): boolean {
  const now = Date.now();

  // Probabilistic GC: on ~1% of calls, evict stale entries so the Map
  // never grows unboundedly during a prolonged Redis outage.
  if (Math.random() < 0.01) {
    for (const [k, v] of fallbackStore) {
      if (now > v.resetAt) fallbackStore.delete(k);
    }
  }

  const record = fallbackStore.get(key);

  if (!record || now > record.resetAt) {
    fallbackStore.set(key, { count: 1, resetAt: now + FALLBACK_WINDOW_MS });
    return true;
  }

  if (record.count >= FALLBACK_MAX_ATTEMPTS) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function limitOrAllow(
  limiter: Ratelimit,
  key: string
): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url.includes("localhost")) {
    return true;
  }
  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch (err) {
    // The error object is not logged: Upstash includes the request path in its
    // errors, and rate-limit keys embed the user's email address.
    console.warn(
      `Rate limiter unavailable [${err instanceof Error ? err.name : "unknown"}], using in-memory fallback`
    );
    return checkInMemoryFallback(key);
  }
}
