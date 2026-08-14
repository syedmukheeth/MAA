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
 * written to a gitignored staff-credentials.local.txt, never to stdout.
 * Emails are always stored lower-cased to match loginAction.
 */
import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
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

  const results: {
    role: string;
    email: string;
    password: string;
    generated: boolean;
  }[] = [];

  for (const staff of STAFF) {
    const email = staff.email.trim().toLowerCase();
    const fromEnv = process.env[staff.envKey];
    const password = fromEnv ?? generatePassword();
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

    results.push({
      role: user.role,
      email: user.email,
      password,
      generated: !fromEnv,
    });
  }

  // Passwords are written to a gitignored file, not to stdout.
  //
  // A terminal scrollback is not a secret store: it survives in shell history
  // files, CI logs and screenshots, and cleartext staff credentials sitting
  // there indefinitely is the kind of thing that turns one leaked laptop into
  // an owner-level account takeover. The operator reads this file once and
  // deletes it.
  const generated = results.filter((r) => r.generated);

  console.log("\nStaff accounts ready:\n");
  for (const r of results) {
    console.log(
      `  ${r.role.padEnd(8)} ${r.email.padEnd(32)} ${
        r.generated ? "password generated" : "password set from env"
      }`
    );
  }

  if (generated.length > 0) {
    const outPath = path.join(process.cwd(), "staff-credentials.local.txt");
    const body = [
      `Generated ${new Date().toISOString()}`,
      "DELETE THIS FILE once the passwords are in your password manager.",
      "",
      ...generated.map((r) => `${r.role.padEnd(8)} ${r.email.padEnd(32)} ${r.password}`),
      "",
    ].join("\n");
    // 0600: readable by the operator only, not by anything else on the machine.
    await writeFile(outPath, body, { encoding: "utf8", mode: 0o600 });
    console.log(
      `\n${generated.length} generated password(s) written to staff-credentials.local.txt`
    );
    console.log("Move them into a password manager and delete that file.\n");
  } else {
    console.log("\nAll passwords came from environment variables.\n");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
