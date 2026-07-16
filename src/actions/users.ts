"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
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

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

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
  const session = await requireRole([...MANAGE_ROLES]);

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
    data: { role: nextRole },
  });

  await recordAudit({
    actorId: session.sub,
    action: "user.role_change",
    entity: "User",
    entityId: userId,
    summary: `${target.email}: ${target.role} → ${nextRole}`,
    metadata: { from: target.role, to: nextRole, targetEmail: target.email },
  });

  revalidatePath("/admin/users");
  return {};
}

export async function setUserActive(
  userId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const session = await requireRole([...MANAGE_ROLES]);

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
    summary: `${target.email} ${isActive ? "reactivated" : "suspended"}`,
    metadata: { isActive, targetEmail: target.email, targetRole: target.role },
  });

  revalidatePath("/admin/users");
  return {};
}
