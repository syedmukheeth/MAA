/**
 * Diagnostic: print every account and its role. No secrets are printed — only
 * whether a password hash exists at all, which is what "Invalid email or
 * password" usually comes down to.
 *
 *   npx tsx --env-file=.env prisma/scripts/list-users.ts
 */
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      role: true,
      isActive: true,
      passwordHash: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  for (const u of users) {
    console.log(
      [
        u.role.padEnd(8),
        u.email.padEnd(34),
        `name=${u.name}`,
        `active=${u.isActive}`,
        `hasPassword=${Boolean(u.passwordHash)}`,
      ].join(" ")
    );
  }
  console.log(`\ntotal=${users.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
