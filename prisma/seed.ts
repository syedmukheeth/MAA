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

async function cleanDatabaseAndSeed() {
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
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "maa-owner@maafurnitures.com";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "MAAOwner@13";
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
  const managerEmail = process.env.SEED_MANAGER_EMAIL ?? "maa-manager@maafurnitures.com";
  const managerPassword = process.env.SEED_MANAGER_PASSWORD ?? "MAAManager@01";
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
