import { cookies } from "next/headers";
import { signSession, SESSION_COOKIE, type Role } from "@/lib/auth/jwt";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Mints the session cookie.
 *
 * Lives here rather than beside its first caller because two very different
 * places need it: the auth flows (register / login / password change) and
 * updateProfile, which bumps tokenVersion and must hand the caller a fresh
 * cookie or it signs them out of their own account.
 */
export async function createSessionCookie(user: {
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
