"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signSession, type Role } from "@/lib/auth/jwt";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { loginRatelimit, registerRatelimit } from "@/lib/redis";
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

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function homeRouteForRole(role: Role) {
  return role === "CUSTOMER" ? "/account" : "/admin";
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

  const { success } = await registerRatelimit.limit(`register:${await clientIp()}`);
  if (!success) {
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
  redirect(homeRouteForRole(user.role));
}

export async function loginAction(
  input: LoginInput
): Promise<{ error?: string }> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { success } = await loginRatelimit.limit(`login:${parsed.data.email}`);
  if (!success) {
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
  redirect(
    parsed.data.next && parsed.data.next.startsWith("/")
      ? parsed.data.next
      : homeRouteForRole(user.role)
  );
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
