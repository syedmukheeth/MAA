"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signSession, type Role } from "@/lib/auth/jwt";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { loginRatelimit, loginIpRatelimit, registerRatelimit } from "@/lib/redis";
import type { Ratelimit } from "@upstash/ratelimit";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validations/auth";

async function clientIp() {
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

async function limitOrAllow(limiter: Ratelimit, key: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url.includes("localhost")) {
    return true;
  }
  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch (err) {
    console.warn(`Rate limiter unavailable for key, using in-memory fallback:`, err);
    return checkInMemoryFallback(key);
  }
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Every role lands on the store; staff reach the back office via /admin. */
const HOME_ROUTE = "/";

/**
 * Only allow same-origin relative redirects after login.
 *
 * `startsWith("/")` is NOT sufficient: browsers resolve `//evil.com` as a
 * protocol-relative URL, so `/login?next=//evil.com` would bounce a user who
 * just typed real credentials straight to an attacker's page. Backslashes are
 * rejected too — some parsers normalise `/\evil.com` the same way.
 */
function safeNextPath(next: string | undefined): string {
  if (!next) return HOME_ROUTE;
  if (!next.startsWith("/")) return HOME_ROUTE;
  if (next.startsWith("//")) return HOME_ROUTE;
  if (next.includes("\\")) return HOME_ROUTE;
  return next;
}

async function createSessionCookie(user: {
  id: string;
  email: string;
  role: Role;
  tokenVersion?: number;
}) {
  const token = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
    tv: user.tokenVersion ?? 0,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function registerAction(
  input: RegisterInput
): Promise<{ error?: string }> {
  try {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const rawEmail = parsed.data.email.trim();
    const normalizedEmail = rawEmail.toLowerCase();

    const allowed = await limitOrAllow(
      registerRatelimit,
      `register:${await clientIp()}`
    );
    if (!allowed) {
      return { error: "Too many attempts. Please try again later." };
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { email: rawEmail }],
      },
    });
    if (existing) {
      return { error: "An account with this email already exists" };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "CUSTOMER",
      },
    });

    await createSessionCookie(user);
    redirect("/account");
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      typeof (err as { digest?: string }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("Registration action failed:", err);
    return {
      error: "Registration failed. Please check your information and try again.",
    };
  }
}

export async function loginAction(
  input: LoginInput
): Promise<{ error?: string }> {
  try {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const rawInput = parsed.data.email.trim();
    const lowerInput = rawInput.toLowerCase();
    const ip = await clientIp();

    const [byEmail, byIp] = await Promise.all([
      limitOrAllow(loginRatelimit, `login:${lowerInput}`),
      limitOrAllow(loginIpRatelimit, `login-ip:${ip}`),
    ]);
    if (!byEmail || !byIp) {
      return { error: "Too many attempts. Please try again in a minute." };
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lowerInput },
          { name: rawInput },
          { email: `${lowerInput}@maafurnitures.com` },
        ],
      },
    });
    if (!user || !user.isActive) {
      return { error: "Invalid email or password" };
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return { error: "Invalid email or password" };
    }

    await createSessionCookie(user);

    const isStaffUser = user.role !== "CUSTOMER";
    const requestedNext = safeNextPath(parsed.data.next);
    const destination = isStaffUser
      ? (requestedNext.startsWith("/admin") ? requestedNext : "/admin")
      : (requestedNext === "/" ? "/account" : requestedNext);

    redirect(destination);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      typeof (err as { digest?: string }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("Login action failed:", err);
    return { error: "Login failed. Please check your credentials and try again." };
  }
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

import { redis, forgotPasswordRatelimit, resetPasswordRatelimit } from "@/lib/redis";
import { getSiteUrl } from "@/lib/site-url";
import { sendEmail } from "@/lib/email";

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function forgotPasswordAction(
  email: string
): Promise<{ success?: boolean; error?: string }> {
  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  // Rate limit by email to avoid email bombing
  const allowed = await limitOrAllow(forgotPasswordRatelimit, `forgot-password:${email}`);
  if (!allowed) {
    return { error: "Too many requests. Please try again later." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Return success even if user not found to prevent user enumeration
    return { success: true };
  }
  if (!user.isActive) {
    return { success: true };
  }

  // Math.random() is seeded from a predictable PRNG — a reset token minted from
  // it can be reproduced from a handful of observed tokens, which is an account
  // takeover. Only a CSPRNG is acceptable here. Redis holds the SHA-256 of the
  // token, so a dump of the store cannot be replayed as a reset link.
  const token = randomBytes(32).toString("base64url");
  await redis.set(`password-reset:${hashResetToken(token)}`, email, { ex: 3600 });

  const resetUrl = `${getSiteUrl()}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Reset your MAA FURNITURE password",
    html: `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#2a2420;">
        <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#a5732f;margin:0 0 24px;">
          MAA FURNITURE
        </p>
        <h1 style="font-size:22px;margin:0 0 8px;">Reset your password</h1>
        <p style="color:#5c5349;font-size:14px;line-height:1.6;">We received a request to reset your password. Click the button below to choose a new password. This link is valid for 1 hour.</p>
        <div style="margin:24px 0;">
          <a href="${resetUrl}" style="background-color:#8b5e3c;color:#faf7f2;padding:12px 24px;text-decoration:none;border-radius:24px;font-size:14px;display:inline-block;font-weight:bold;">Reset Password</a>
        </div>
        <p style="color:#8a8078;font-size:12px;margin-top:32px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  return { success: true };
}

export async function resetPasswordAction(
  token: string,
  input: { password?: string; confirmPassword?: string }
): Promise<{ success?: boolean; error?: string }> {
  if (!token) {
    return { error: "Invalid or expired reset token." };
  }

  // Rate limit reset attempts per IP to prevent brute-force
  const ip = await clientIp();
  const allowed = await limitOrAllow(resetPasswordRatelimit, `reset-password:${ip}`);
  if (!allowed) {
    return { error: "Too many attempts. Please try again later." };
  }

  if (!input.password || input.password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (input.password !== input.confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const tokenKey = `password-reset:${hashResetToken(token)}`;
  const email = await redis.get<string>(tokenKey);
  if (!email) {
    return { error: "Invalid or expired reset token. Please request another one." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user || !user.isActive) {
    return { error: "Account not found or deactivated." };
  }

  const passwordHash = await hashPassword(input.password);

  // Increment tokenVersion to invalidate all existing sessions — the attacker's
  // stolen cookie becomes worthless the moment the real user resets.
  await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      tokenVersion: { increment: 1 },
    },
  });

  await redis.del(tokenKey);

  return { success: true };
}
