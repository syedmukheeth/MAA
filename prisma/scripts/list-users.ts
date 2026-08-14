/**
 * Diagnostic: print every account and its role. No secrets are printed — only
 * whether a password hash exists at all, which is what "Invalid email or
 * password" usually comes down to.
 *
 *   npx tsx --env-file=.env prisma/scripts/list-users.ts
 *   npx tsx --env-file=.env prisma/scripts/list-users.ts --full
 *
 * Emails and names are masked by default. The output of this script lands in a
 * terminal, a screenshot, or a pasted support thread, and "print the whole
 * customer list" is not a thing a debugging aid should do by accident. --full
 * is there when you genuinely need to match an exact address.
 */
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

const showFull = process.argv.includes("--full");

function mask(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const head = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${head}***${email.slice(at)}`;
}

async function main() {
  const users = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      role: true,
      isActive: true,
      erasedAt: true,
      // Selected only to test for presence — never printed, and never compared.
      passwordHash: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  for (const u of users) {
    console.log(
      [
        u.role.padEnd(8),
        (showFull ? u.email : mask(u.email)).padEnd(34),
        showFull ? `name=${u.name}` : "",
        `active=${u.isActive}`,
        `hasPassword=${Boolean(u.passwordHash)}`,
        u.erasedAt ? "ERASED" : "",
      ]
        .filter(Boolean)
        .join(" ")
    );
  }
  console.log(`\ntotal=${users.length}`);
  if (!showFull) {
    console.log("Emails masked. Pass --full to show them in full.");
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
