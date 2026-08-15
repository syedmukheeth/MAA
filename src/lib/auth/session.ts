import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { reportSecurityEvent } from "@/lib/security";
import { verifySession, SESSION_COOKIE, type Role, type SessionPayload } from "./jwt";

export { SESSION_COOKIE };

export const getCurrentUser = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
});

/**
 * Verifies the JWT and re-checks the user row so suspensions, role
 * changes, and password changes take effect immediately instead of at
 * token expiry.
 */
export const getActiveUser = cache(async (): Promise<SessionPayload | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: {
      isActive: true,
      role: true,
      tokenVersion: true,
      mustChangePassword: true,
    },
  });
  if (!dbUser || !dbUser.isActive) return null;
  // Reject tokens minted before the latest password/role change
  if (dbUser.tokenVersion > user.tv) return null;
  // The row wins over the `pw` claim: the token is a cache that can be up to
  // seven days stale, and an operator who re-provisions an account expects the
  // change screen to appear on the next request, not at token expiry.
  return { ...user, role: dbUser.role as Role, pw: dbUser.mustChangePassword };
});

/**
 * Where an account still on a provisioned temporary password must go.
 *
 * Handing a client a password we generated means we have seen it — it sits in
 * whatever channel it was sent through until they replace it. Blocking every
 * other route until they do is what keeps that window to one login.
 */
export const CHANGE_PASSWORD_ROUTE = "/change-password";

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
  // Before the role check, not after: an account on a temporary password has no
  // business anywhere else, and a 403 would be a misleading answer to "why can't
  // I get in".
  if (user.pw) redirect(CHANGE_PASSWORD_ROUTE);
  if (!allowed.includes(user.role)) {
    // Recorded, not just redirected. A signed-in user reaching a page their
    // role forbids is usually a stale bookmark — but a run of them from one
    // account is someone trying doors, and that is invisible if the only
    // response is a silent 403.
    //
    // Deliberately fire-and-forget with a catch: an authorisation check must
    // never fail open, or fail at all, because telemetry is unavailable.
    void reportSecurityEvent({
      type: "UNAUTHORISED_ACCESS_ATTEMPT",
      userId: user.sub,
      summary: `${user.role} attempted an action restricted to ${allowed.join(", ")}`,
      metadata: { role: user.role, allowed },
    }).catch(() => {});
    redirect("/403");
  }
  return user;
}

export async function requireAuth(): Promise<SessionPayload> {
  const user = await getActiveUser();
  if (!user) redirect("/login");
  if (user.pw) redirect(CHANGE_PASSWORD_ROUTE);
  return user;
}

/**
 * Signed-in check that tolerates an unsettled password.
 *
 * Only the change-password screen and its action may use this — everything else
 * goes through requireAuth/requireRole so the redirect above is unavoidable.
 * Without it those two would bounce themselves in a loop.
 */
export async function requireAuthPendingPassword(): Promise<SessionPayload> {
  const user = await getActiveUser();
  if (!user) redirect("/login");
  return user;
}
