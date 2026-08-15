import { headers } from "next/headers";
import type { Ratelimit } from "@upstash/ratelimit";

/**
 * Shared rate-limit plumbing.
 *
 * Extracted from actions/auth.ts when the DPDP privacy actions needed the same
 * guarantees — a second copy of the fail-closed fallback would have drifted
 * from the first the moment either was tuned.
 */

/**
 * The client address, from a header the platform sets rather than one the
 * client can choose.
 *
 * The leftmost `x-forwarded-for` entry is caller-controlled: a proxy that
 * appends leaves whatever the client sent sitting in front of the real
 * address. Keying rate limits on it means an attacker gets a fresh bucket per
 * request simply by varying the header, and the same value feeds hashIp() into
 * SecurityEvent.ipHash — so the spraying detector, which groups by ipHash,
 * never sees a repeat either.
 *
 * `x-vercel-forwarded-for` and `x-real-ip` are both overwritten by Vercel's
 * edge on the way in, so they cannot be forged from outside. The XFF fallback
 * is for local development, where nothing sets the other two — and it takes the
 * RIGHTMOST entry, which is the one the nearest trusted hop appended.
 */
export async function clientIp(): Promise<string> {
  const headerList = await headers();

  const platform =
    headerList.get("x-vercel-forwarded-for")?.trim() ||
    headerList.get("x-real-ip")?.trim();
  if (platform) return platform;

  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
    const nearest = hops[hops.length - 1];
    if (nearest) return nearest;
  }

  return "unknown";
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
  // Unconfigured is an outage, not an exemption. Returning true here disabled
  // every limit in the application — login, register, password reset, grievance,
  // data export — with nothing in the UI or the logs to say so, which turns one
  // missing environment variable in Vercel into unbounded credential stuffing.
  // The same in-memory fallback that covers a Redis outage covers this.
  if (!url || !token || url.includes("localhost")) {
    return checkInMemoryFallback(key);
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
