import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession, SESSION_COOKIE, type Role, type SessionPayload } from "./jwt";

export { SESSION_COOKIE };

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * Verifies the JWT and re-checks the user row so suspensions, role
 * changes, and password changes take effect immediately instead of at
 * token expiry.
 *
 * The `tokenVersion` check is the key addition: when a user changes their
 * password or has their role changed, `tokenVersion` is incremented in the
 * database. Any JWT minted before that increment carries a stale `tv` and
 * is rejected here — effectively invalidating all existing sessions.
 */
export async function getActiveUser(): Promise<SessionPayload | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { isActive: true, role: true, tokenVersion: true },
  });
  if (!dbUser || !dbUser.isActive) return null;
  // Reject tokens minted before the latest password/role change
  if (dbUser.tokenVersion > user.tv) return null;
  return { ...user, role: dbUser.role as Role };
}

/**
 * Guards for pages and staff-only actions.
 *
 * These redirect rather than throw. A thrown Error surfaces as an unstyled 500
 * — the wrong answer for "you're signed out" or "you lack permission", both of
 * which are ordinary states with a correct destination.
 */
export async function requireRole(allowed: Role[]): Promise<SessionPayload> {
  const user = await getActiveUser();
  if (!user) redirect("/login");
  if (!allowed.includes(user.role)) redirect("/403");
  return user;
}

export async function requireAuth(): Promise<SessionPayload> {
  const user = await getActiveUser();
  if (!user) redirect("/login");
  return user;
}
