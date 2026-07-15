import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifySession, type Role, type SessionPayload } from "./jwt";

export const SESSION_COOKIE = "maa_session";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * Verifies the JWT and re-checks the user row so suspensions and role
 * changes take effect immediately instead of at token expiry.
 */
async function getActiveUser(): Promise<SessionPayload | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { isActive: true, role: true },
  });
  if (!dbUser || !dbUser.isActive) return null;
  return { ...user, role: dbUser.role as Role };
}

export async function requireRole(allowed: Role[]): Promise<SessionPayload> {
  const user = await getActiveUser();
  if (!user || !allowed.includes(user.role)) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAuth(): Promise<SessionPayload> {
  const user = await getActiveUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
