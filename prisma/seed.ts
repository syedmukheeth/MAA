import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
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
const PRODUCTS: SeedProduct[] = [
  // LIVING ROOM
  {
    name: "Kurnool Heritage Sofa",
    slug: "kurnool-heritage-sofa",
    description:
      "Hand-carved teak frame three-seater with kiln-dried hardwood joinery and premium cotton upholstery. Built in our Kurnool workshop.",
    price: 68500,
    category: "LIVING_ROOM",
    materials: ["Teak", "Cotton Upholstery"],
    dimensions: '84" x 36" x 32"',
    images: [unsplash("photo-1555041469-a586c61ea9bc")],
    featured: true,
    variants: [
      { name: "Teak / Natural / 3-seater", woodType: "Teak", finish: "Natural", size: "3-seater", stock: 6 },
      { name: "Teak / Walnut / 3-seater", woodType: "Teak", finish: "Walnut", size: "3-seater", priceDelta: 2500, stock: 4 },
      { name: "Teak / Natural / 2-seater", woodType: "Teak", finish: "Natural", size: "2-seater", priceDelta: -12000, stock: 5 },
    ],
  },
  {
    name: "Nallamala Lounge Chair",
    slug: "nallamala-lounge-chair",
    description:
      "Sculpted lounge chair with cane backrest and rosewood arms. A statement piece for reading corners.",
    price: 24900,
    category: "LIVING_ROOM",
    materials: ["Rosewood", "Cane"],
    dimensions: '30" x 32" x 34"',
    images: [unsplash("photo-1567538096630-e0c55bd6374c")],
    featured: true,
    variants: [
      { name: "Rosewood / Natural", woodType: "Rosewood", finish: "Natural", stock: 8 },
      { name: "Rosewood / Dark Polish", woodType: "Rosewood", finish: "Dark Polish", priceDelta: 1500, stock: 3 },
    ],
  },
  {
    name: "Tungabhadra Coffee Table",
    slug: "tungabhadra-coffee-table",
    description:
      "Live-edge mango wood coffee table with hairpin steel legs and matte varnish.",
    price: 15800,
    category: "LIVING_ROOM",
    materials: ["Mango Wood", "Steel"],
    dimensions: '44" x 24" x 17"',
    images: [unsplash("photo-1532372320572-cda25653a26d")],
    variants: [{ name: "Default", stock: 12 }],
  },
  {
    name: "Deccan TV Console",
    slug: "deccan-tv-console",
    description:
      "Low-profile media console with fluted shutter doors, brass handles, and cable management.",
    price: 32400,
    category: "LIVING_ROOM",
    materials: ["Sheesham", "Brass"],
    dimensions: '64" x 16" x 22"',
    images: [unsplash("photo-1581428982868-e410dd047a90")],
    variants: [
      { name: "Sheesham / Honey", woodType: "Sheesham", finish: "Honey", stock: 5 },
      { name: "Sheesham / Espresso", woodType: "Sheesham", finish: "Espresso", stock: 2 },
    ],
  },
  // BEDROOM
  {
    name: "Amaravati King Bed",
    slug: "amaravati-king-bed",
    description:
      "King-size platform bed with upholstered headboard and solid teak slats. Optional hydraulic storage.",
    price: 78900,
    category: "BEDROOM",
    materials: ["Teak", "Linen"],
    dimensions: '78" x 72" x 48"',
    images: [unsplash("photo-1505693416388-ac5ce068fe85")],
    featured: true,
    variants: [
      { name: "King / Teak / Natural", woodType: "Teak", finish: "Natural", size: "King", stock: 4 },
      { name: "Queen / Teak / Natural", woodType: "Teak", finish: "Natural", size: "Queen", priceDelta: -9000, stock: 6 },
      { name: "King / Teak / Walnut", woodType: "Teak", finish: "Walnut", size: "King", priceDelta: 3000, stock: 2 },
    ],
  },
  {
    name: "Srisailam Wardrobe",
    slug: "srisailam-wardrobe",
    description:
      "Three-door wardrobe with full-length mirror, cedar-lined drawers, and soft-close hinges.",
    price: 56700,
    category: "BEDROOM",
    materials: ["Sheesham", "Cedar", "Mirror"],
    dimensions: '54" x 22" x 84"',
    images: [unsplash("photo-1595428774223-ef52624120d2")],
    variants: [
      { name: "3-door", size: "3-door", stock: 3 },
      { name: "2-door", size: "2-door", priceDelta: -14000, stock: 5 },
    ],
  },
  {
    name: "Handri Bedside Table",
    slug: "handri-bedside-table",
    description:
      "Compact bedside table with one drawer and open shelf, finished in hand-rubbed oil.",
    price: 8900,
    category: "BEDROOM",
    materials: ["Mango Wood"],
    dimensions: '18" x 16" x 24"',
    images: [unsplash("photo-1551298370-9d3d53740c72")],
    variants: [{ name: "Default", stock: 15, lowStockThreshold: 4 }],
  },
  {
    name: "Konda Dresser",
    slug: "konda-dresser",
    description:
      "Six-drawer dresser with dovetail joinery and antique brass pulls.",
    price: 41200,
    category: "BEDROOM",
    materials: ["Teak", "Brass"],
    dimensions: '58" x 18" x 32"',
    images: [unsplash("photo-1594026112284-02bb6f3352fe")],
    variants: [{ name: "Default", stock: 4 }],
  },
  // DINING
  {
    name: "Rayalaseema Dining Table",
    slug: "rayalaseema-dining-table",
    description:
      "Six-seater dining table with bevelled solid-wood top and tapered legs. Seats eight with extension.",
    price: 52300,
    category: "DINING",
    materials: ["Teak"],
    dimensions: '72" x 36" x 30"',
    images: [unsplash("photo-1617806118233-18e1de247200")],
    featured: true,
    variants: [
      { name: "6-seater / Teak", woodType: "Teak", size: "6-seater", stock: 5 },
      { name: "8-seater / Teak", woodType: "Teak", size: "8-seater", priceDelta: 11000, stock: 2 },
    ],
  },
  {
    name: "Pennar Dining Chair",
    slug: "pennar-dining-chair",
    description:
      "Curved-back dining chair with woven seat, sold individually.",
    price: 7400,
    category: "DINING",
    materials: ["Teak", "Rattan"],
    dimensions: '18" x 20" x 34"',
    images: [unsplash("photo-1503602642458-232111445657")],
    variants: [
      { name: "Teak / Natural", woodType: "Teak", finish: "Natural", stock: 24 },
      { name: "Teak / Walnut", woodType: "Teak", finish: "Walnut", priceDelta: 400, stock: 12 },
    ],
  },
  {
    name: "Krishna Crockery Cabinet",
    slug: "krishna-crockery-cabinet",
    description:
      "Glass-front crockery cabinet with interior lighting and adjustable shelves.",
    price: 38600,
    category: "DINING",
    materials: ["Sheesham", "Glass"],
    dimensions: '42" x 16" x 72"',
    images: [unsplash("photo-1538688525198-9b88f6f53126")],
    variants: [{ name: "Default", stock: 3 }],
  },
  {
    name: "Gooty Bar Counter",
    slug: "gooty-bar-counter",
    description:
      "Compact home bar counter with bottle racks, stemware holders, and stone top.",
    price: 45800,
    category: "DINING",
    materials: ["Mango Wood", "Granite"],
    dimensions: '48" x 20" x 42"',
    images: [unsplash("photo-1572297870735-065dcf9dca86")],
    variants: [{ name: "Default", stock: 2, lowStockThreshold: 2 }],
  },
  // OFFICE
  {
    name: "Belum Study Desk",
    slug: "belum-study-desk",
    description:
      "Writing desk with two drawers, cable grommet, and leather inlay writing surface.",
    price: 27900,
    category: "OFFICE",
    materials: ["Sheesham", "Leather"],
    dimensions: '52" x 26" x 30"',
    images: [unsplash("photo-1518455027359-f3f8164ba6bd")],
    featured: true,
    variants: [
      { name: "Sheesham / Honey", woodType: "Sheesham", finish: "Honey", stock: 7 },
      { name: "Sheesham / Espresso", woodType: "Sheesham", finish: "Espresso", stock: 4 },
    ],
  },
  {
    name: "Orvakal Ergonomic Chair",
    slug: "orvakal-ergonomic-chair",
    description:
      "Wood-frame office chair with breathable mesh back and adjustable height.",
    price: 16500,
    category: "OFFICE",
    materials: ["Beech", "Mesh"],
    dimensions: '24" x 24" x 40"',
    images: [unsplash("photo-1580480055273-228ff5388ef8")],
    variants: [{ name: "Default", stock: 10 }],
  },
  {
    name: "Ahobilam Bookshelf",
    slug: "ahobilam-bookshelf",
    description:
      "Five-tier open bookshelf with ladder profile and anti-tip wall anchor.",
    price: 19800,
    category: "OFFICE",
    materials: ["Mango Wood", "Iron"],
    dimensions: '32" x 14" x 74"',
    images: [unsplash("photo-1594620302200-9a762244a156")],
    variants: [
      { name: "5-tier", size: "5-tier", stock: 6 },
      { name: "3-tier", size: "3-tier", priceDelta: -6500, stock: 9 },
    ],
  },
  {
    name: "Yaganti Filing Cabinet",
    slug: "yaganti-filing-cabinet",
    description:
      "Three-drawer filing cabinet with lock, suited for home offices.",
    price: 14200,
    category: "OFFICE",
    materials: ["Sheesham", "Steel"],
    dimensions: '18" x 20" x 40"',
    images: [unsplash("photo-1497366216548-37526070297c")],
    variants: [{ name: "Default", stock: 5 }],
  },
  // OUTDOOR
  {
    name: "Mantralayam Garden Bench",
    slug: "mantralayam-garden-bench",
    description:
      "Weather-treated acacia garden bench with slatted seat and cast-iron arms.",
    price: 18700,
    category: "OUTDOOR",
    materials: ["Acacia", "Cast Iron"],
    dimensions: '50" x 24" x 34"',
    images: [unsplash("photo-1595429035839-c99c298ffdde")],
    variants: [{ name: "Default", stock: 8 }],
  },
  {
    name: "Adoni Patio Set",
    slug: "adoni-patio-set",
    description:
      "Four-seater patio set with coffee table, all-weather wicker over aluminium frames.",
    price: 62400,
    category: "OUTDOOR",
    materials: ["Wicker", "Aluminium"],
    dimensions: "Set of 5 pieces",
    images: [unsplash("photo-1600210492486-724fe5c67fb0")],
    featured: true,
    variants: [
      { name: "4-seater", size: "4-seater", stock: 3 },
      { name: "6-seater", size: "6-seater", priceDelta: 18000, stock: 1, lowStockThreshold: 1 },
    ],
  },
  {
    name: "Alampur Swing Chair",
    slug: "alampur-swing-chair",
    description:
      "Hanging swing chair with stand, rope weave seat, and cushion included.",
    price: 21300,
    category: "OUTDOOR",
    materials: ["Rattan", "Steel"],
    dimensions: '40" x 40" x 78"',
    images: [unsplash("photo-1616047006789-b7af5afb8c20")],
    variants: [{ name: "Default", stock: 4 }],
  },
  {
    name: "Peta Planter Stand",
    slug: "peta-planter-stand",
    description:
      "Tiered planter stand for balconies, holds six pots, teak-oil finished.",
    price: 6800,
    category: "OUTDOOR",
    materials: ["Acacia"],
    dimensions: '36" x 12" x 40"',
    images: [unsplash("photo-1585320806297-9794b3e4eeae")],
    variants: [{ name: "Default", stock: 18 }],
  },
];

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
  const combos = [
    {
      slug: "dining-set-combo",
      name: "Complete Dining Set",
      description:
        "Rayalaseema six-seater dining table with six Pennar dining chairs. Save over buying separately.",
      bundlePrice: 89900,
      image: unsplash("photo-1617806118233-18e1de247200"),
      items: [
        { slug: "rayalaseema-dining-table", quantity: 1 },
        { slug: "pennar-dining-chair", quantity: 6 },
      ],
    },
    {
      slug: "work-from-home-combo",
      name: "Work From Home Bundle",
      description:
        "Belum study desk, Orvakal ergonomic chair, and Ahobilam bookshelf — the full home office.",
      bundlePrice: 57900,
      image: unsplash("photo-1518455027359-f3f8164ba6bd"),
      items: [
        { slug: "belum-study-desk", quantity: 1 },
        { slug: "orvakal-ergonomic-chair", quantity: 1 },
        { slug: "ahobilam-bookshelf", quantity: 1 },
      ],
    },
  ];

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
