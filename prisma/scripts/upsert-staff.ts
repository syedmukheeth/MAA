/**
 * Non-destructive staff account provisioning.
 *
 * `prisma/seed.ts` wipes orders, carts and every non-staff user — it is a
 * dev-reset tool and must never be pointed at production. This script only
 * upserts the three back-office accounts and touches nothing else, so it is
 * safe to run against the live database.
 *
 *   npx tsx --env-file=.env prisma/scripts/upsert-staff.ts
 *
 * Passwords come from STAFF_OWNER_PASSWORD / STAFF_ADMIN_PASSWORD /
 * STAFF_MANAGER_PASSWORD when set; otherwise a random one is generated and
 * printed once. Emails are always stored lower-cased to match loginAction.
 */
import { randomBytes } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

type StaffRole = "OWNER" | "ADMIN" | "MANAGER";

/** Satisfies the register schema's upper/lower/digit rule so the same value can
 *  also be re-used through the password-reset form. */
function generatePassword(): string {
  return `Maa${randomBytes(9).toString("base64url").replace(/[^a-zA-Z0-9]/g, "x")}9`;
}

const STAFF: { role: StaffRole; email: string; name: string; envKey: string }[] = [
  {
    role: "OWNER",
    email: process.env.STAFF_OWNER_EMAIL ?? "owner@maafurnitures.com",
    name: process.env.STAFF_OWNER_NAME ?? "MAA Owner",
    envKey: "STAFF_OWNER_PASSWORD",
  },
  {
    role: "ADMIN",
    email: process.env.STAFF_ADMIN_EMAIL ?? "admin@maafurnitures.com",
    name: process.env.STAFF_ADMIN_NAME ?? "MAA Admin",
    envKey: "STAFF_ADMIN_PASSWORD",
  },
  {
    role: "MANAGER",
    email: process.env.STAFF_MANAGER_EMAIL ?? "manager@maafurnitures.com",
    name: process.env.STAFF_MANAGER_NAME ?? "MAA Manager",
    envKey: "STAFF_MANAGER_PASSWORD",
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — pass --env-file=.env");
  }

  const results: { role: string; email: string; password: string }[] = [];

  for (const staff of STAFF) {
    const email = staff.email.trim().toLowerCase();
    const password = process.env[staff.envKey] ?? generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);

    // Bumping tokenVersion invalidates any session still holding the old
    // password's JWT, the same guarantee resetPasswordAction gives.
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: staff.name,
        passwordHash,
        role: staff.role,
        isActive: true,
        tokenVersion: { increment: 1 },
      },
      create: {
        name: staff.name,
        email,
        passwordHash,
        role: staff.role,
      },
    });

    results.push({ role: user.role, email: user.email, password });
  }

  console.log("\nStaff accounts ready:\n");
  for (const r of results) {
    console.log(`  ${r.role.padEnd(8)} ${r.email.padEnd(32)} ${r.password}`);
  }
  console.log("\nStore these somewhere safe — the hashes cannot be read back.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
