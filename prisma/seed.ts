/**
 * LOCAL DEVELOPMENT ONLY.
 *
 * This script deletes every order, cart, address, custom request and audit log,
 * then deletes every user except the two it creates. Pointed at production it
 * destroys the client's real staff accounts and order history.
 *
 * Two guards below make that mistake hard to make: it refuses to run outside a
 * local database, and it refuses to invent passwords. For provisioning staff on
 * a live database use `npm run db:staff` (prisma/scripts/upsert-staff.ts), which
 * is non-destructive; to clear a store before handover use `npm run db:reset`.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// See src/lib/db.ts — DATABASE_SSL=false is the local-Postgres escape hatch.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

/**
 * Refuses anything that is not unmistakably a local database.
 *
 * Host allow-list rather than a NODE_ENV check: `tsx prisma/seed.ts` runs with
 * NODE_ENV unset, so a production guard keyed on it would never fire — and the
 * one thing this script must never do is run against the pooled Supabase URL
 * sitting in the same .env the local one lives in.
 */
function assertLocalDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — pass --env-file=.env");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("prisma/seed.ts is a development tool and never runs in production.");
  }

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error("DATABASE_URL is not a parseable connection string.");
  }

  const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1", "host.docker.internal", "db", "postgres"];
  if (!LOCAL_HOSTS.includes(host)) {
    throw new Error(
      `Refusing to seed: DATABASE_URL points at "${host}", not a local database.\n` +
        "This script deletes every order and every user except the two it creates.\n" +
        "For a live database use `npm run db:staff` (provisioning) or `npm run db:reset` (store wipe)."
    );
  }
}

/** No fallbacks. A default password committed to the repo is a published
 *  credential — this one was, in two places, and reached every deployment that
 *  ever ran the seed. */
function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `${key} is not set. Seed passwords must be supplied explicitly — there are no defaults.`
    );
  }
  return value;
}

async function cleanDatabaseAndSeed() {
  assertLocalDatabase();
  console.log("Cleaning database and setting up fresh owner & manager accounts...");

  // 1. Delete all transactional, test, order, cart, and log data
  await prisma.orderItem.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartComboSelection.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.customFurnitureRequest.deleteMany({});
  await prisma.auditLog.deleteMany({});

  // 2. Ensure owner user exists
  const ownerEmail = requiredEnv("SEED_OWNER_EMAIL");
  const ownerPassword = requiredEnv("SEED_OWNER_PASSWORD");
  const ownerName = process.env.SEED_OWNER_NAME ?? "maa-owner";
  const ownerPasswordHash = await bcrypt.hash(ownerPassword, 12);

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      name: ownerName,
      passwordHash: ownerPasswordHash,
      role: "OWNER",
      isActive: true,
    },
    create: {
      name: ownerName,
      email: ownerEmail,
      passwordHash: ownerPasswordHash,
      role: "OWNER",
    },
  });
  console.log(`Owner account ready (${owner.name}): ${owner.email}`);

  // 3. Ensure manager user exists
  const managerEmail = requiredEnv("SEED_MANAGER_EMAIL");
  const managerPassword = requiredEnv("SEED_MANAGER_PASSWORD");
  const managerName = process.env.SEED_MANAGER_NAME ?? "maa-manager";
  const managerPasswordHash = await bcrypt.hash(managerPassword, 12);

  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {
      name: managerName,
      passwordHash: managerPasswordHash,
      role: "MANAGER",
      isActive: true,
    },
    create: {
      name: managerName,
      email: managerEmail,
      passwordHash: managerPasswordHash,
      role: "MANAGER",
    },
  });
  console.log(`Manager account ready (${manager.name}): ${manager.email}`);

  // 4. Reassign existing products, combos, testimonials to owner
  await prisma.product.updateMany({ data: { createdById: owner.id } });
  await prisma.combo.updateMany({ data: { createdById: owner.id } });
  await prisma.testimonial.updateMany({ data: { createdById: owner.id } });

  // 5. Delete all other old/test users
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { notIn: [owner.id, manager.id] },
    },
  });

  console.log(`Purged all old user records (${deletedUsers.count} removed). Database cleanup complete!`);
}

async function main() {
  await cleanDatabaseAndSeed();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
