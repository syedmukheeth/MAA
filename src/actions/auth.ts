"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
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
 * Rate limiting must never be the reason nobody can sign in.
 *
 * If Upstash is unreachable or out of quota, `.limit()` rejects — and an
 * unguarded await here would take down login for every user, owner included.
 * Auth fails OPEN: brute-force is still bounded by bcrypt cost 12, whereas a
 * closed failure is a total outage caused by the rate limiter.
 *
 * (The custom-request endpoint deliberately fails CLOSED instead — there the
 * downside is an unbounded email flood, not a lockout.)
 */
async function limitOrAllow(limiter: Ratelimit, key: string): Promise<boolean> {
  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch (err) {
    console.error("Rate limiter unavailable, failing open:", err);
    return true;
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
}) {
  const token = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
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
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const allowed = await limitOrAllow(registerRatelimit, `register:${await clientIp()}`);
  if (!allowed) {
    return { error: "Too many attempts. Please try again later." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  await createSessionCookie(user);
  redirect(HOME_ROUTE);
}

export async function loginAction(
  input: LoginInput
): Promise<{ error?: string }> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Limit on BOTH email and IP. Email alone lets an attacker lock any user —
  // including the owner — out of their own account by spamming failures at it.
  // IP alone lets a password spray walk the whole user table unimpeded.
  const ip = await clientIp();
  const [byEmail, byIp] = await Promise.all([
    limitOrAllow(loginRatelimit, `login:${parsed.data.email}`),
    limitOrAllow(loginIpRatelimit, `login-ip:${ip}`),
  ]);
  if (!byEmail || !byIp) {
    return { error: "Too many attempts. Please try again in a minute." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user || !user.isActive) {
    return { error: "Invalid email or password" };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  await createSessionCookie(user);
  redirect(safeNextPath(parsed.data.next));
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

import { redis, forgotPasswordRatelimit } from "@/lib/redis";
import { getSiteUrl } from "@/lib/site-url";
import { sendEmail } from "@/lib/email";

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

  // Security: Do not reveal if user email exists or not
  if (!user || !user.isActive) {
    return { success: true };
  }

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  await redis.set(`password-reset:${token}`, email, { ex: 3600 }); // 1 hour expiry

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

  if (!input.password || input.password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (input.password !== input.confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const email = await redis.get<string>(`password-reset:${token}`);
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

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  await redis.del(`password-reset:${token}`);

  return { success: true };
}
