"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signSession, type Role } from "@/lib/auth/jwt";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { loginRatelimit, loginIpRatelimit, registerRatelimit } from "@/lib/redis";
import { clientIp, limitOrAllow } from "@/lib/rate-limit";
import { reportFailedLogin, reportLoginSuccess } from "@/lib/security";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy/constants";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validations/auth";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Customers land in the store catalogue after signing in. */
const STORE_ROUTE = "/products";

/**
 * Staff land on their back-office dashboard, not the storefront: they
 * administer the shop, they do not buy from it (see the CUSTOMER-only checks
 * in addToCart / placeOrder). The dashboard is the overview page, so it is the
 * right first screen for every staff role — settings is one click from there.
 */
const STAFF_ROUTE = "/admin";

/**
 * Only allow same-origin relative redirects after login.
 *
 * `startsWith("/")` is NOT sufficient: browsers resolve `//evil.com` as a
 * protocol-relative URL, so `/login?next=//evil.com` would bounce a user who
 * just typed real credentials straight to an attacker's page. Backslashes are
 * rejected too — some parsers normalise `/\evil.com` the same way.
 */
function safeNextPath(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  if (next.includes("\\")) return null;
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
        // Consent is recorded in the same write as the account so the two can
        // never disagree about whether it was given at signup.
        //
        // Only a ticked box writes a row. An unticked box writes NOTHING — it
        // does not write a WITHDRAWN record, because that would claim consent
        // was given and then revoked, which is false. Absence of a row is the
        // correct representation of "never agreed", and isGranted() treats it
        // as such.
        ...(parsed.data.marketingConsent
          ? {
              consentRecords: {
                create: {
                  purpose: "MARKETING_EMAIL" as const,
                  status: "GRANTED" as const,
                  noticeVersion: PRIVACY_NOTICE_VERSION,
                  source: "REGISTRATION" as const,
                },
              },
            }
          : {}),
      },
    });

    await createSessionCookie(user);
    redirect(STORE_ROUTE);
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

    // Case-insensitive: rows created before registerAction normalised on insert
    // (and rows created by the seed straight from SEED_*_EMAIL) can carry
    // mixed-case addresses that an exact match would never find.
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: lowerInput, mode: "insensitive" } },
          { email: { equals: `${lowerInput}@maafurnitures.com`, mode: "insensitive" } },
        ],
      },
    });
    if (!user || !user.isActive) {
      // Recorded even when the address matches no account: a source working
      // through a list of guessed addresses is exactly the spraying pattern the
      // detector looks for, and it is invisible if only real accounts count.
      // The response to the client is unchanged, so this leaks no enumeration.
      await reportFailedLogin({ ip, userId: user?.id ?? null });
      return { error: "Invalid email or password" };
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      await reportFailedLogin({ ip, userId: user.id });
      return { error: "Invalid email or password" };
    }

    // Before the cookie is set, so a takeover alert is recorded even if the
    // session write somehow fails.
    await reportLoginSuccess({ ip, userId: user.id });

    await createSessionCookie(user);

    const isStaffUser = user.role !== "CUSTOMER";
    const requestedNext = safeNextPath(parsed.data.next);
    const destination = isStaffUser
      ? requestedNext?.startsWith("/admin")
        ? requestedNext
        : STAFF_ROUTE
      : (requestedNext ?? STORE_ROUTE);

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
  const emailParseResult = z.string().email().safeParse(email.trim());
  if (!emailParseResult.success) {
    return { error: "Please enter a valid email address." };
  }

  // Accounts are stored lower-cased (registerAction normalises before insert),
  // and login matches case-insensitively. A raw `findUnique` on whatever the
  // user typed silently missed every account whose input differed in case, and
  // the enumeration-safe `{ success: true }` below hid the miss — the user saw
  // "check your email" for a mail that was never sent.
  const normalizedEmail = emailParseResult.data.toLowerCase();

  // Rate limit by email to avoid email bombing
  const allowed = await limitOrAllow(
    forgotPasswordRatelimit,
    `forgot-password:${normalizedEmail}`
  );
  if (!allowed) {
    return { error: "Too many requests. Please try again later." };
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
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
  // Store the row's own address, not the typed one: resetPasswordAction looks
  // the account back up by this exact string.
  await redis.set(`password-reset:${hashResetToken(token)}`, user.email, { ex: 3600 });

  const resetUrl = `${getSiteUrl()}/reset-password?token=${token}`;

  const sent = await sendEmail({
    to: user.email,
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

  if (!sent) {
    // Do not leak whether the address exists, but do not strand a real user on
    // a "check your email" screen for a mail Resend rejected either.
    console.error(
      "Password reset email could not be delivered — check RESEND_API_KEY and that EMAIL_FROM's domain is verified in Resend."
    );
    await redis.del(`password-reset:${hashResetToken(token)}`);
    return { error: "We could not send the reset email right now. Please try again shortly." };
  }

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
