import { cookies } from "next/headers";
import { verifySession, type Role, type SessionPayload } from "./jwt";

export const SESSION_COOKIE = "maa_session";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireRole(allowed: Role[]): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user || !allowed.includes(user.role)) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAuth(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
