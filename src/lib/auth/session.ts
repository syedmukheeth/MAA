import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
 *
 * Exported because the storefront is public: actions reachable by anonymous
 * visitors (add-to-cart) need to branch on "not signed in" rather than be
 * redirected mid-action.
 */
export async function getActiveUser(): Promise<SessionPayload | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { isActive: true, role: true },
  });
  if (!dbUser || !dbUser.isActive) return null;
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
