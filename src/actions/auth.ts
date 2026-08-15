"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signSession, type Role } from "@/lib/auth/jwt";
import { SESSION_COOKIE, requireAuthPendingPassword } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { loginRatelimit, loginIpRatelimit, registerRatelimit } from "@/lib/redis";
import { clientIp, limitOrAllow } from "@/lib/rate-limit";
import { reportFailedLogin, reportLoginSuccess } from "@/lib/security";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy/constants";
import {
  loginSchema,
  registerSchema,
  passwordSchema,
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
  mustChangePassword?: boolean;
}) {
  const token = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
    tv: user.tokenVersion ?? 0,
    pw: user.mustChangePassword === true,
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
    //
    // A bare username used to be expanded to `<input>@maafurnitures.com` here.
    // That domain is not the one the site runs on (maafurniture.shop), so the
    // shortcut taught staff an address that exists nowhere else — in their
    // mailbox, in Resend, or in a password-reset link. Full address only.
    const user = await prisma.user.findFirst({
      where: { email: { equals: lowerInput, mode: "insensitive" } },
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

    // Provisioned account still on the password we generated: nothing else is
    // reachable until it is replaced, so send them straight there rather than
    // letting the guards bounce them off whatever they asked for.
    if (user.mustChangePassword) {
      redirect("/change-password");
    }

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

/**
 * Sets a new password for the signed-in account.
 *
 * Two callers, one action:
 *  - `/change-password`, reached because the account is still on the temporary
 *    password we generated at provisioning. The current password is not asked
 *    for again — it was just used to get here, and prompting for a credential
 *    the operator also knows adds nothing.
 *  - `/admin/account`, a voluntary change. Here the current password IS
 *    required: a session alone must not be enough, or a borrowed browser turns
 *    into a permanent lockout of the real owner.
 *
 * The forced branch is only reachable while `mustChangePassword` is true, which
 * is set by the provisioning script and cleared here — it cannot be used to skip
 * the current-password check on a settled account.
 */
export async function changePasswordAction(input: {
  currentPassword?: string;
  password?: string;
  confirmPassword?: string;
}): Promise<{ success?: boolean; error?: string }> {
  const session = await requireAuthPendingPassword();

  const account = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, role: true, passwordHash: true, mustChangePassword: true },
  });
  if (!account) return { error: "Account not found." };

  const ip = await clientIp();
  const allowed = await limitOrAllow(
    resetPasswordRatelimit,
    `change-password:${account.id}`
  );
  if (!allowed) {
    return { error: "Too many attempts. Please try again later." };
  }

  const passwordCheck = passwordSchema.safeParse(input.password ?? "");
  if (!passwordCheck.success) {
    return { error: passwordCheck.error.issues[0]?.message ?? "Invalid password." };
  }
  const password = passwordCheck.data;

  if (password !== input.confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (!account.mustChangePassword) {
    if (
      !input.currentPassword ||
      !(await verifyPassword(input.currentPassword, account.passwordHash))
    ) {
      // Counted as a failed login: someone guessing at the current password from
      // inside a session is the same signal as guessing at the login form.
      await reportFailedLogin({ ip, userId: account.id });
      return { error: "Your current password is incorrect." };
    }
  }

  // Re-using the temporary password would leave the account on a credential the
  // operator has seen while reporting itself as settled.
  if (await verifyPassword(password, account.passwordHash)) {
    return { error: "Choose a password you have not used on this account before." };
  }

  const passwordHash = await hashPassword(password);
  const updated = await prisma.user.update({
    where: { id: account.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      // Kills every other session holding the old password's JWT.
      tokenVersion: { increment: 1 },
    },
    select: { id: true, email: true, role: true, tokenVersion: true },
  });

  // The bump above invalidates this browser's cookie too. Without re-issuing it
  // here the user is silently signed out by the very act of securing their
  // account — and on the forced path they would land back on /login with a
  // temporary password that no longer works.
  await createSessionCookie({
    id: updated.id,
    email: updated.email,
    role: updated.role as Role,
    tokenVersion: updated.tokenVersion,
    mustChangePassword: false,
  });

  await recordAudit({
    actorId: account.id,
    action: "user.password_change",
    entity: "User",
    entityId: account.id,
    summary: account.mustChangePassword
      ? "Temporary password replaced by the account owner"
      : "Password changed by the account owner",
    metadata: { forced: account.mustChangePassword },
  });

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

import { redis, forgotPasswordRatelimit, resetPasswordRatelimit } from "@/lib/redis";
import { getSiteUrl } from "@/lib/site-url";
import { sendEmail } from "@/lib/email";
import { passwordResetHtml } from "@/lib/email-templates";

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
    html: passwordResetHtml(resetUrl),
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

  // Same rules as registration. A reset that accepted a weaker password than
  // signup would make the mailbox-only path the cheapest way to weaken an
  // account.
  const passwordCheck = passwordSchema.safeParse(input.password ?? "");
  if (!passwordCheck.success) {
    return {
      error: passwordCheck.error.issues[0]?.message ?? "Invalid password.",
    };
  }

  const password = passwordCheck.data;

  if (password !== input.confirmPassword) {
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

  const passwordHash = await hashPassword(password);

  // Increment tokenVersion to invalidate all existing sessions — the attacker's
  // stolen cookie becomes worthless the moment the real user resets.
  await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      // A password chosen through the emailed link is the account owner's own,
      // so this settles a provisioned account just as /change-password does.
      // Leaving the flag set would strand them on the change screen right after
      // a successful reset.
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      tokenVersion: { increment: 1 },
    },
  });

  await redis.del(tokenKey);

  return { success: true };
}
