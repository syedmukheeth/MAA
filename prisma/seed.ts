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

const TEST_PASSWORD = "Test@1234";

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?w=1200&q=80`;

type SeedVariant = {
  name: string;
  woodType?: string;
  finish?: string;
  size?: string;
  priceDelta?: number;
  stock: number;
  lowStockThreshold?: number;
};

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  price: number;
  category: "LIVING_ROOM" | "BEDROOM" | "DINING" | "OFFICE" | "OUTDOOR";
  materials: string[];
  dimensions?: string;
  images: string[];
  featured?: boolean;
  variants: SeedVariant[];
};

// placeholder-* images per plan rule #7 (Unsplash allowed as clearly-named seed placeholders)
const PRODUCTS: SeedProduct[] = [];

async function seedOwner() {
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;
  const name = process.env.SEED_OWNER_NAME ?? "Owner";

  if (!email || !password) {
    console.log("SEED_OWNER_EMAIL / SEED_OWNER_PASSWORD not set — skipping owner.");
    return null;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Owner account already exists for ${email}.`);
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const owner = await prisma.user.create({
    data: { name, email, passwordHash, role: "OWNER" },
  });
  console.log(`Seeded Owner account: ${owner.email}`);
  return owner;
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  const users = [
    { name: "Test Admin", email: "admin@maa.test", role: "ADMIN" as const },
    { name: "Test Manager", email: "manager@maa.test", role: "MANAGER" as const },
    { name: "Test Customer", email: "customer@maa.test", role: "CUSTOMER" as const },
    { name: "Second Customer", email: "customer2@maa.test", role: "CUSTOMER" as const },
  ];
  const result: Record<string, string> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
    result[u.email] = user.id;
  }
  console.log(
    `Seeded test users (password: ${TEST_PASSWORD}): ${users
      .map((u) => u.email)
      .join(", ")}`
  );
  return result;
}

async function seedProducts(createdById: string) {
  let created = 0;
  for (const p of PRODUCTS) {
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
    });
    if (existing) continue;

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          category: p.category,
          materials: p.materials,
          dimensions: p.dimensions,
          images: p.images,
          featured: p.featured ?? false,
          createdById,
        },
      });

      let total = 0;
      for (const [index, v] of p.variants.entries()) {
        const variant = await tx.variant.create({
          data: {
            productId: product.id,
            name: v.name,
            woodType: v.woodType ?? null,
            finish: v.finish ?? null,
            size: v.size ?? null,
            priceDelta: v.priceDelta ?? 0,
            stock: v.stock,
            lowStockThreshold: v.lowStockThreshold ?? 3,
            isDefault: index === 0,
          },
        });
        if (v.stock > 0) {
          await tx.stockMovement.create({
            data: {
              variantId: variant.id,
              type: "RECEIVED",
              qty: v.stock,
              reason: "Initial stock (seed)",
            },
          });
        }
        total += v.stock;
      }
      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: total },
      });
    });
    created++;
  }
  console.log(`Seeded ${created} new products (${PRODUCTS.length} defined).`);
}

async function seedCombos(createdById: string) {
  const combos: {
    slug: string;
    name: string;
    description: string;
    bundlePrice: number;
    image: string;
    items: { slug: string; quantity: number }[];
  }[] = [];

  for (const c of combos) {
    const existing = await prisma.combo.findUnique({ where: { slug: c.slug } });
    if (existing) continue;

    const products = await prisma.product.findMany({
      where: { slug: { in: c.items.map((i) => i.slug) } },
      select: { id: true, slug: true },
    });
    const idBySlug = Object.fromEntries(products.map((p) => [p.slug, p.id]));
    if (c.items.some((i) => !idBySlug[i.slug])) continue;

    await prisma.combo.create({
      data: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        bundlePrice: c.bundlePrice,
        image: c.image,
        createdById,
        items: {
          create: c.items.map((i) => ({
            productId: idBySlug[i.slug],
            quantity: i.quantity,
          })),
        },
      },
    });
  }
  console.log("Seeded combos.");
}

async function seedOrders(customerIds: string[]) {
  const orders: {
    orderNumber: string;
    userId: string;
    status: "DELIVERED" | "CONFIRMED" | "PENDING" | "CANCELLED";
    productSlug: string;
    quantity: number;
  }[] = [
    { orderNumber: "MAA-SEED1", userId: customerIds[0], status: "DELIVERED", productSlug: "nallamala-lounge-chair", quantity: 1 },
    { orderNumber: "MAA-SEED2", userId: customerIds[0], status: "CONFIRMED", productSlug: "handri-bedside-table", quantity: 2 },
    { orderNumber: "MAA-SEED3", userId: customerIds[1] ?? customerIds[0], status: "PENDING", productSlug: "peta-planter-stand", quantity: 1 },
    { orderNumber: "MAA-SEED4", userId: customerIds[1] ?? customerIds[0], status: "CANCELLED", productSlug: "orvakal-ergonomic-chair", quantity: 1 },
  ];

  for (const o of orders) {
    const existing = await prisma.order.findUnique({
      where: { orderNumber: o.orderNumber },
    });
    if (existing) continue;

    const product = await prisma.product.findUnique({
      where: { slug: o.productSlug },
      include: { variants: { where: { isDefault: true } } },
    });
    const variant = product?.variants[0];
    if (!product || !variant) continue;

    const unitPrice = Number(product.price) + Number(variant.priceDelta);
    const lineTotal = unitPrice * o.quantity;
    const cancelled = o.status === "CANCELLED";

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: o.orderNumber,
          userId: o.userId,
          status: o.status,
          subtotal: lineTotal,
          total: lineTotal,
          paymentMethod: "COD",
          shippingName: "Seed Customer",
          shippingPhone: "9000000000",
          shippingLine1: "12-3-45 Main Road",
          shippingCity: "Kurnool",
          shippingState: "Andhra Pradesh",
          shippingPincode: "518001",
          items: {
            create: [
              {
                productId: product.id,
                variantId: variant.id,
                variantName: variant.isDefault ? null : variant.name,
                name: product.name,
                unitPrice,
                quantity: o.quantity,
                lineTotal,
              },
            ],
          },
        },
      });

      // SOLD movement; for the cancelled order add matching RETURNED so the ledger reconciles
      await tx.stockMovement.create({
        data: {
          variantId: variant.id,
          type: "SOLD",
          qty: -o.quantity,
          reason: "Seed order",
          orderId: order.id,
        },
      });
      if (cancelled) {
        await tx.stockMovement.create({
          data: {
            variantId: variant.id,
            type: "RETURNED",
            qty: o.quantity,
            reason: "Order cancelled (seed)",
            orderId: order.id,
          },
        });
      } else {
        const updated = await tx.variant.update({
          where: { id: variant.id },
          data: { stock: { decrement: o.quantity } },
        });
        if (updated.stock < 0) throw new Error("Seed oversold variant");
        const agg = await tx.variant.aggregate({
          where: { productId: product.id },
          _sum: { stock: true },
        });
        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: agg._sum.stock ?? 0 },
        });
      }
    });
  }
  console.log("Seeded sample orders MAA-SEED1..4.");
}

async function main() {
  const owner = await seedOwner();
  const userIds = await seedUsers();

  const staffId =
    owner?.id ??
    (await prisma.user.findFirst({ where: { role: { not: "CUSTOMER" } } }))?.id;
  if (!staffId) throw new Error("No staff user available to own seed products");

  await seedProducts(staffId);
  await seedCombos(staffId);
  await seedOrders([
    userIds["customer@maa.test"],
    userIds["customer2@maa.test"],
  ]);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
