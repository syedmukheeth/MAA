"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { reportSecurityEvent } from "@/lib/security";
import type { Role } from "@/lib/auth/jwt";

/**
 * Privilege ordering. A staff member may never grant a role above their own,
 * nor act on a user who outranks them.
 */
const ROLE_RANK: Record<Role, number> = {
  OWNER: 3,
  ADMIN: 2,
  MANAGER: 1,
  CUSTOMER: 0,
};

import { USER_MANAGE_ROLES } from "@/lib/auth/roles";

function isRole(value: unknown): value is Role {
  return typeof value === "string" && value in ROLE_RANK;
}

/** Owners are the only role that can restore other owners — never strand zero. */
async function isLastActiveOwner(userId: string): Promise<boolean> {
  const owners = await prisma.user.count({
    where: { role: "OWNER", isActive: true, NOT: { id: userId } },
  });
  return owners === 0;
}

export async function changeUserRole(
  userId: string,
  nextRole: Role
): Promise<{ error?: string }> {
  const session = await requireRole([...USER_MANAGE_ROLES]);

  // Server actions accept whatever a caller POSTs; the TS type is erased.
  if (!isRole(nextRole)) return { error: "Unknown role" };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "User not found" };

  // No self-role changes, in any direction. Self-promotion is the escalation
  // path; self-demotion is a lockout. The table's disabled dropdown is not a
  // control — this is.
  if (target.id === session.sub) {
    return { error: "You cannot change your own role" };
  }

  const actorRank = ROLE_RANK[session.role];

  if (ROLE_RANK[target.role] > actorRank) {
    return { error: `Only an Owner can change another Owner's role` };
  }

  // The escalation guard: you cannot hand out authority you don't hold.
  if (ROLE_RANK[nextRole] > actorRank) {
    return { error: `You cannot grant the ${nextRole} role` };
  }

  if (target.role === "OWNER" && nextRole !== "OWNER" && (await isLastActiveOwner(target.id))) {
    return { error: "This is the last active Owner. Promote another Owner first." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: nextRole, tokenVersion: { increment: 1 } },
  });

  await recordAudit({
    actorId: session.sub,
    action: "user.role_change",
    entity: "User",
    entityId: userId,
    // The user id, not the email. `entityId` already identifies the account and
    // the admin UI joins to User for display, so duplicating the address into a
    // log that is retained for years is collection for nothing — and it is what
    // made a DPDP erasure need a JSONB scrub in the first place.
    summary: `${target.id}: ${target.role} → ${nextRole}`,
    metadata: { from: target.role, to: nextRole },
  });

  // Only a rise in privilege is a security signal. A demotion is routine
  // housekeeping; someone gaining access to every customer record is the event
  // you want to hear about within the hour, and the one an attacker who has
  // taken a staff session performs first.
  if (ROLE_RANK[nextRole] > ROLE_RANK[target.role]) {
    await reportSecurityEvent({
      type: "PRIVILEGE_ESCALATION",
      userId: target.id,
      summary: `Account promoted from ${target.role} to ${nextRole}`,
      metadata: { from: target.role, to: nextRole, byActor: session.sub },
    });
  }

  revalidatePath("/admin/users");
  return {};
}

export async function setUserActive(
  userId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const session = await requireRole([...USER_MANAGE_ROLES]);

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "User not found" };

  if (target.id === session.sub) {
    return { error: "You cannot change your own status" };
  }

  if (ROLE_RANK[target.role] > ROLE_RANK[session.role]) {
    return { error: "Only an Owner can suspend another Owner" };
  }

  if (target.role === "OWNER" && !isActive && (await isLastActiveOwner(target.id))) {
    return { error: "This is the last active Owner and cannot be suspended." };
  }

  await prisma.user.update({ where: { id: userId }, data: { isActive } });

  await recordAudit({
    actorId: session.sub,
    action: "user.set_active",
    entity: "User",
    entityId: userId,
    summary: `${target.id} ${isActive ? "reactivated" : "suspended"}`,
    metadata: { isActive, targetRole: target.role },
  });

  // Staff only. Suspending a customer is ordinary moderation; reactivating a
  // dormant staff account is how an attacker quietly restores a foothold they
  // had lost, so it is worth surfacing even though it looks administrative.
  if (target.role !== "CUSTOMER") {
    await reportSecurityEvent({
      type: "STAFF_ACCESS_CHANGED",
      userId: target.id,
      summary: `${target.role} account ${isActive ? "reactivated" : "suspended"}`,
      metadata: { isActive, targetRole: target.role, byActor: session.sub },
    });
  }

  revalidatePath("/admin/users");
  return {};
}
