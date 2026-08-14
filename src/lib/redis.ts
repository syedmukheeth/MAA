import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = (url && token)
  ? new Redis({ url, token })
  : new Redis({ url: "https://localhost", token: "none" });

/** Per-account: slows credential stuffing against one known email. */
export const loginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:login",
});

/**
 * Per-IP: catches password spraying — one guess each across thousands of
 * emails, which the per-account limiter never sees. Looser than the email
 * window so a shared office NAT isn't punished for normal use.
 */
export const loginIpRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "300 s"),
  prefix: "ratelimit:login-ip",
});

export const registerRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "3600 s"),
  prefix: "ratelimit:register",
});

export const uploadRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "3600 s"),
  prefix: "ratelimit:upload",
});

/**
 * Custom furniture requests are rare and high-intent, but each one emails every
 * OWNER and ADMIN — so an unlimited endpoint is an email amplifier pointed at
 * our own staff. 5/hour per IP is generous for a real customer.
 */
export const customRequestRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "3600 s"),
  prefix: "ratelimit:custom-request",
});

export const forgotPasswordRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "3600 s"), // 3 reset requests per hour per email
  prefix: "ratelimit:forgot-password",
});

/** Throttle actual reset attempts per IP so a leaked token can't be replayed
 *  or brute-forced indefinitely. */
export const resetPasswordRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "900 s"), // 5 attempts per 15 minutes per IP
  prefix: "ratelimit:reset-password",
});

/**
 * A data export assembles every row we hold about one person into a single JSON
 * payload — the most concentrated read in the app. Keyed per user, not per IP:
 * the limit exists to stop a hijacked session from repeatedly exfiltrating, and
 * three per day is far above any genuine need.
 */
export const dataExportRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "86400 s"),
  prefix: "ratelimit:data-export",
});

/**
 * Erasure and correction requests. Low limit because each one creates staff
 * work and, for erasure, schedules an irreversible job.
 */
export const privacyRequestRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "86400 s"),
  prefix: "ratelimit:privacy-request",
});

/** Grievances email the grievance officer, so the endpoint is an email
 *  amplifier the same way custom requests are. */
export const grievanceRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "86400 s"),
  prefix: "ratelimit:grievance",
});

/** The search endpoint is public and hits the database. Unbounded, a bot can
 *  hammer it and create real load on PostgreSQL. */
export const searchRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"), // 60 requests per minute per IP
  prefix: "ratelimit:search",
});
