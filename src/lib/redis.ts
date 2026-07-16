import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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
