import { PrismaClient, type RoomCategory } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Fills the storefront with a showcase catalogue so the site can be demoed,
 * screenshotted and handed over before the owner has photographed a single
 * piece.
 *
 * The images are stock photography from Unsplash (free licence, no attribution
 * required; ids in public/showcase/CREDITS.md), self-hosted as WEBP in
 * public/showcase so next/image needs no extra remote host. They are stand-ins
 * for the demo: none shows a piece this shop built, and every row the script
 * writes is an ordinary admin-editable row, so the owner replaces each one from
 * /admin as their own photos arrive.
 *
 * Nothing is deleted and nothing existing is overwritten except by slug: rerun
 * it as often as you like. `--remove` takes the whole showcase back out again,
 * matching only the slugs below, which is how you clear it before launch.
 *
 * Usage:
 *   npm run db:showcase -- --confirm
 *   npm run db:showcase -- --confirm --remove
 */

// See src/lib/db.ts — DATABASE_SSL=false is the local-Postgres escape hatch.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

/**
 * Both spellings, for the same reason as db:reset: `CONFIRM_SHOWCASE=YES npm
 * run ...` is bash-only and PowerShell has no inline env-var prefix, so the
 * `--` flag is the form that works in either shell.
 */
const confirmed =
  process.env.CONFIRM_SHOWCASE === "YES" || process.argv.includes("--confirm");

const removing = process.argv.includes("--remove");

const IMG = "/showcase";

type SeedVariant = {
  name: string;
  woodType?: string;
  finish?: string;
  size?: string;
  priceDelta: string;
  sku: string;
  stock: number;
  isDefault?: boolean;
};

type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  price: string;
  mrp: string;
  category: RoomCategory;
  materials: string[];
  dimensions: string;
  images: string[];
  stockQuantity: number;
  featured: boolean;
  variants: SeedVariant[];
};

/**
 * Prices are plausible Kurnool retail for solid-wood pieces, in rupees. They
 * are demo figures and the owner edits every one at /admin/products — no claim
 * is made here about what anything actually costs.
 */
const PRODUCTS: SeedProduct[] = [
  {
    slug: "marwar-carved-teak-sofa-set",
    name: "Marwar Carved Teak Sofa Set (3+1+1)",
    description:
      "A full drawing-room set in seasoned teak, with hand-carved scroll armrests and a chiselled floral apron running the length of the frame. Cushions are high-density foam under cotton-silk upholstery, and the frame is jointed, not stapled.",
    price: "84999",
    mrp: "109999",
    category: "LIVING_ROOM",
    materials: ["Teak wood", "High-density foam", "Cotton silk upholstery"],
    dimensions: '3-seater 78" x 34" x 36" · Armchairs 34" x 34" x 36"',
    images: [`${IMG}/teak-carved-sofa-set.webp`, `${IMG}/combo-living-room.webp`],
    stockQuantity: 6,
    featured: true,
    variants: [
      {
        name: "Teak · Honey Finish",
        woodType: "Teak",
        finish: "Honey",
        priceDelta: "0",
        sku: "MAA-SOFA-TEAK-HNY",
        stock: 4,
        isDefault: true,
      },
      {
        name: "Teak · Walnut Finish",
        woodType: "Teak",
        finish: "Walnut",
        priceDelta: "4000",
        sku: "MAA-SOFA-TEAK-WAL",
        stock: 2,
      },
    ],
  },
  {
    slug: "recliner-sectional-sofa",
    name: "Kurnool Recliner Sectional Sofa",
    description:
      "A corner sectional with two power-free recliners, a cupholder console and deep, soft-padded seats. Hardwood frame, high-resilience foam and a suede-finish fabric that wipes clean.",
    price: "94999",
    mrp: "119999",
    category: "LIVING_ROOM",
    materials: ["Hardwood frame","High-resilience foam","Suede-finish fabric"],
    dimensions: "Corner 112\" x 112\" x 38\" · Seat depth 24\"",
    images: [`${IMG}/recliner-sectional-sofa.webp`],
    stockQuantity: 4,
    featured: true,
    variants: [
      {
        name: "Brown · Suede Finish",
        woodType: "Hardwood",
        finish: "Brown",
        priceDelta: "0",
        sku: "MAA-RCL-SEC-BRN",
        stock: 3,
        isDefault: true,
      },
      {
        name: "Grey · Suede Finish",
        woodType: "Hardwood",
        finish: "Grey",
        priceDelta: "0",
        sku: "MAA-RCL-SEC-GRY",
        stock: 1,
      },
    ],
  },
  {
    slug: "godavari-sheesham-dining-set",
    name: "Godavari Sheesham Dining Set (6 Seater)",
    description:
      "Six-seater dining in solid sheesham, with a 46 mm top, carved legs and cane-back chairs that stay cool through a Kurnool summer. Brass inlay along the apron. Chairs are sold with the table as one set.",
    price: "64999",
    mrp: "79999",
    category: "DINING",
    materials: ["Sheesham wood", "Natural cane", "Brass inlay"],
    dimensions: 'Table 72" x 36" x 30" · Chairs 18" x 18" x 40"',
    images: [`${IMG}/sheesham-dining-set.webp`],
    stockQuantity: 5,
    featured: true,
    variants: [
      {
        name: "6 Seater · Sheesham",
        woodType: "Sheesham",
        finish: "Deep Brown",
        size: "6 Seater",
        priceDelta: "0",
        sku: "MAA-DINE-6-SHSM",
        stock: 4,
        isDefault: true,
      },
      {
        name: "8 Seater · Sheesham",
        woodType: "Sheesham",
        finish: "Deep Brown",
        size: "8 Seater",
        priceDelta: "14000",
        sku: "MAA-DINE-8-SHSM",
        stock: 1,
      },
    ],
  },
  {
    slug: "jali-carved-almirah",
    name: "Jali Carved Almirah",
    description:
      "A two-door almirah with pierced jali panels above and solid carved panels below, brass handles and a brass lock plate. Internally: one hanging rail, two adjustable shelves and a lockable drawer.",
    price: "52999",
    mrp: "64999",
    category: "BEDROOM",
    materials: ["Teak wood", "Brass fittings"],
    dimensions: '48" x 22" x 78"',
    images: [`${IMG}/carved-almirah-wardrobe.webp`, `${IMG}/combo-bedroom.webp`],
    stockQuantity: 3,
    featured: false,
    variants: [
      {
        name: "2 Door · Teak",
        woodType: "Teak",
        finish: "Honey",
        size: "2 Door",
        priceDelta: "0",
        sku: "MAA-ALM-2D-TEAK",
        stock: 2,
        isDefault: true,
      },
      {
        name: "3 Door · Teak",
        woodType: "Teak",
        finish: "Honey",
        size: "3 Door",
        priceDelta: "16000",
        sku: "MAA-ALM-3D-TEAK",
        stock: 1,
      },
    ],
  },
  {
    slug: "leather-tufted-sofa",
    name: "Leather Tufted 3-Seater Sofa",
    description:
      "A three-seater with button-tufted seat and back in soft leatherette, bolster arms and solid wood legs. Firm enough for everyday use, easy to wipe down.",
    price: "46999",
    mrp: "58999",
    category: "LIVING_ROOM",
    materials: ["Hardwood frame","Leatherette upholstery","High-density foam"],
    dimensions: "84\" x 36\" x 33\"",
    images: [`${IMG}/leather-tufted-sofa.webp`],
    stockQuantity: 6,
    featured: false,
    variants: [
      {
        name: "Tan · 3 Seater",
        woodType: "Hardwood",
        finish: "Tan",
        size: "3 Seater",
        priceDelta: "0",
        sku: "MAA-LTH-3S-TAN",
        stock: 4,
        isDefault: true,
      },
      {
        name: "Tan · 2 Seater",
        woodType: "Hardwood",
        finish: "Tan",
        size: "2 Seater",
        priceDelta: "-9000",
        sku: "MAA-LTH-2S-TAN",
        stock: 2,
      },
    ],
  },
  {
    slug: "kakatiya-carved-teak-cot",
    name: "Kakatiya Carved Teak Cot (King)",
    description:
      "A king cot with a carved and jali-inlaid headboard, mortise-and-tenon frame and a slatted base that needs no box support. Available with a hydraulic storage box under the platform.",
    price: "71999",
    mrp: "88999",
    category: "BEDROOM",
    materials: ["Teak wood", "Brass inlay"],
    dimensions: 'King 78" x 72" · Headboard height 48"',
    images: [`${IMG}/carved-teak-cot.webp`, `${IMG}/combo-bedroom.webp`],
    stockQuantity: 4,
    featured: true,
    variants: [
      {
        name: "King · Without Storage",
        woodType: "Teak",
        finish: "Honey",
        size: "King",
        priceDelta: "0",
        sku: "MAA-COT-K-PLAIN",
        stock: 2,
        isDefault: true,
      },
      {
        name: "King · Hydraulic Storage",
        woodType: "Teak",
        finish: "Honey",
        size: "King",
        priceDelta: "12000",
        sku: "MAA-COT-K-HYD",
        stock: 2,
      },
    ],
  },
  {
    slug: "cushion-headboard-bed",
    name: "Cushion Headboard Double Bed",
    description:
      "A queen bed with a padded, button-tufted headboard and a solid wood frame with slatted base, so no box support is needed. Pairs with the Jali Almirah.",
    price: "36999",
    mrp: "45999",
    category: "BEDROOM",
    materials: ["Hardwood frame","Upholstered headboard","Plywood slats"],
    dimensions: "Queen 66\" x 82\" · Headboard height 50\"",
    images: [`${IMG}/cushion-headboard-bed.webp`],
    stockQuantity: 5,
    featured: true,
    variants: [
      {
        name: "Queen · Beige",
        woodType: "Hardwood",
        finish: "Beige",
        size: "Queen",
        priceDelta: "0",
        sku: "MAA-BED-Q-BGE",
        stock: 3,
        isDefault: true,
      },
      {
        name: "King · Beige",
        woodType: "Hardwood",
        finish: "Beige",
        size: "King",
        priceDelta: "6000",
        sku: "MAA-BED-K-BGE",
        stock: 2,
      },
    ],
  },
  {
    slug: "sheesham-tea-poy",
    name: "Sheesham Tea Poy",
    description:
      "A solid sheesham centre table, sized for the tea tray and the day's newspaper. Plank top, thick square legs, finished with a lacquer that takes a hot cup.",
    price: "12999",
    mrp: "16999",
    category: "LIVING_ROOM",
    materials: ["Sheesham wood","Melamine lacquer"],
    dimensions: "36\" x 22\" x 17\"",
    images: [`${IMG}/tea-poy-wooden.webp`],
    stockQuantity: 10,
    featured: true,
    variants: [
      {
        name: "Natural Finish",
        woodType: "Sheesham",
        finish: "Natural",
        priceDelta: "0",
        sku: "MAA-POY-NAT",
        stock: 6,
        isDefault: true,
      },
      {
        name: "Walnut Finish",
        woodType: "Sheesham",
        finish: "Walnut",
        priceDelta: "1000",
        sku: "MAA-POY-WAL",
        stock: 4,
      },
    ],
  },
  {
    slug: "lshape-corner-sofa",
    name: "L-Shape Fabric Corner Sofa",
    description:
      "A five-seater L-shape in a hard-wearing grey fabric, with loose back cushions and a deep chaise end. Built on a seasoned hardwood frame with metal feet.",
    price: "58999",
    mrp: "72999",
    category: "LIVING_ROOM",
    materials: ["Hardwood frame","Woven fabric","High-density foam"],
    dimensions: "L 108\" x 72\" x 34\"",
    images: [`${IMG}/lshape-corner-sofa.webp`],
    stockQuantity: 5,
    featured: true,
    variants: [
      {
        name: "Grey · Left Chaise",
        woodType: "Hardwood",
        finish: "Grey",
        size: "Left Chaise",
        priceDelta: "0",
        sku: "MAA-LSH-GRY-L",
        stock: 3,
        isDefault: true,
      },
      {
        name: "Grey · Right Chaise",
        woodType: "Hardwood",
        finish: "Grey",
        size: "Right Chaise",
        priceDelta: "0",
        sku: "MAA-LSH-GRY-R",
        stock: 2,
      },
    ],
  },
];

/**
 * Earlier showcase rows that are no longer part of the catalogue (the shop
 * sells sofas, beds and tea poys, not swings or shrines). Seeding switches them
 * off rather than deleting them, so an order that already references one keeps
 * its history; `--remove` deletes them along with everything else.
 */
const RETIRED_SLUGS = [
  "kurnool-jhoola-swing",
  "tirumala-puja-mandir",
  "sheesham-study-desk",
  "konaseema-cane-outdoor-set",
];

const COMBOS = [
  {
    slug: "drawing-room-complete",
    name: "Drawing Room, Complete",
    description:
      "The carved sofa set and a matching tea poy, bought together. One delivery, one installation visit, and the finishes are matched across all three pieces at the workshop before they leave.",
    bundlePrice: "89999",
    image: `${IMG}/combo-living-room.webp`,
    items: [
      { slug: "marwar-carved-teak-sofa-set", quantity: 1 },
      { slug: "sheesham-tea-poy", quantity: 1 },
    ],
  },
  {
    slug: "master-bedroom-set",
    name: "Master Bedroom Set",
    description:
      "The king cot and the jali almirah as one order, finished to match. The commonest way this shop sells a bedroom — and cheaper than the two pieces bought separately.",
    bundlePrice: "114999",
    image: `${IMG}/combo-bedroom.webp`,
    items: [
      { slug: "kakatiya-carved-teak-cot", quantity: 1 },
      { slug: "jali-carved-almirah", quantity: 1 },
    ],
  },
];

const HERO_IMAGE = `${IMG}/hero-living-room.webp`;
const STUDIO_IMAGE = `${IMG}/custom-studio-workshop.webp`;
const SETTINGS_ID = "singleton";

/**
 * Only ever writes the two image fields. Every other column on the singleton is
 * the owner's copy — headline, stats, showroom address — and the create branch
 * below exists purely so this script works against an empty local database. It
 * mirrors DEFAULT_SITE_SETTINGS in src/lib/site-settings.ts; a live database
 * always has the row already and takes the update branch.
 */
async function applySettingsImages(remove: boolean) {
  const existing = await prisma.siteSettings.findUnique({
    where: { id: SETTINGS_ID },
  });

  if (existing) {
    // Clearing only removes what this script put there, so an owner-uploaded
    // image that replaced it later is never wiped by `--remove`.
    const data: { heroImageUrl?: string; studioImageUrl?: string | null } = {};
    if (remove) {
      if (existing.heroImageUrl === HERO_IMAGE) data.heroImageUrl = "";
      if (existing.studioImageUrl === STUDIO_IMAGE) data.studioImageUrl = null;
    } else {
      data.heroImageUrl = HERO_IMAGE;
      data.studioImageUrl = STUDIO_IMAGE;
    }
    if (Object.keys(data).length === 0) {
      console.log("  settings: left alone (images are the owner's own)");
      return;
    }
    await prisma.siteSettings.update({ where: { id: SETTINGS_ID }, data });
    console.log(`  settings: hero + studio images ${remove ? "cleared" : "set"}`);
    return;
  }

  if (remove) return;

  await prisma.siteSettings.create({
    data: {
      id: SETTINGS_ID,
      heroHeadline: "Crafted For Homes.\nBuilt For Generations.",
      heroSubtext:
        "Premium handcrafted furniture designed to bring timeless beauty and lasting comfort into every space.",
      heroImageUrl: HERO_IMAGE,
      studioImageUrl: STUDIO_IMAGE,
      brandLabel: "Crafted For Better Living",
      brandHeadline:
        "We don't build furniture. We shape the way you live, gather, and grow, one room at a time.",
      statYearsExperience: 0,
      statProjectsDelivered: 0,
      statHappyFamilies: 0,
      statGoogleRating: "",
      showroomAddress:
        "Door No 87/1240, MAA FURNITURE, Ramalingam Subhashini Complex, 4th employees colony, near by Shakthi Auto Mobiles, Revenue Colony, Sree Rama Nagar, Kurnool, Kalluru, Andhra Pradesh 518002",
      showroomHours: "Mon - Sat: 10:00 AM - 8:00 PM · Sun: 11:00 AM - 6:00 PM",
      showroomPhone: "8886995345, 9912330151",
      showroomWhatsapp: "8886995345",
      deliveryMessage: "Delivery in Andhra Pradesh Only",
    },
  });
  console.log("  settings: singleton created with showcase images");
}

async function seed() {
  // Products and combos both need an author, and it has to be a real staff row
  // — the storefront joins createdBy. Matched on role so it works on any
  // database, including one whose accounts were made through /admin.
  const owner = await prisma.user.findFirst({
    where: { role: { in: ["OWNER", "MANAGER"] }, isActive: true },
    orderBy: { role: "asc" },
  });
  if (!owner) {
    throw new Error(
      "No active OWNER or MANAGER on this database. Run `npm run db:staff` first — every product and combo needs a staff author."
    );
  }
  console.log(`Author: ${owner.name} <${owner.email}>\n`);

  console.log("Products");
  for (const p of PRODUCTS) {
    const { variants, ...fields } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...fields, isActive: true },
      create: { ...fields, createdById: owner.id },
    });

    for (const v of variants) {
      await prisma.variant.upsert({
        where: { productId_name: { productId: product.id, name: v.name } },
        update: { ...v },
        create: { ...v, productId: product.id },
      });
    }
    console.log(`  ${p.slug}  (${variants.length} variants)`);
  }

  const retired = await prisma.product.updateMany({
    where: { slug: { in: RETIRED_SLUGS } },
    data: { isActive: false },
  });
  if (retired.count) {
    console.log(`\nSwitched off ${retired.count} retired showcase products`);
  }

  console.log("\nCombos");
  for (const c of COMBOS) {
    const { items, ...fields } = c;
    const combo = await prisma.combo.upsert({
      where: { slug: c.slug },
      update: { ...fields, isActive: true },
      create: { ...fields, createdById: owner.id },
    });

    // Drop items left over from an earlier version of the combo.
    const keep = await prisma.product.findMany({
      where: { slug: { in: items.map((i) => i.slug) } },
      select: { id: true },
    });
    await prisma.comboItem.deleteMany({
      where: { comboId: combo.id, productId: { notIn: keep.map((k) => k.id) } },
    });

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { slug: item.slug },
        select: { id: true },
      });
      if (!product) continue;
      await prisma.comboItem.upsert({
        where: {
          comboId_productId: { comboId: combo.id, productId: product.id },
        },
        update: { quantity: item.quantity },
        create: {
          comboId: combo.id,
          productId: product.id,
          quantity: item.quantity,
        },
      });
    }
    console.log(`  ${c.slug}  (${items.length} items)`);
  }

  console.log("\nSite settings");
  await applySettingsImages(false);
}

async function remove() {
  const slugs = [...PRODUCTS.map((p) => p.slug), ...RETIRED_SLUGS];
  const comboSlugs = COMBOS.map((c) => c.slug);

  // Combos first: a ComboItem references the products below, and the cascade
  // only runs from the combo side.
  const combos = await prisma.combo.deleteMany({
    where: { slug: { in: comboSlugs } },
  });
  const products = await prisma.product.deleteMany({
    where: { slug: { in: slugs } },
  });

  console.log(`Removed ${combos.count} combos and ${products.count} products.`);
  await applySettingsImages(true);
}

async function main() {
  if (!confirmed) {
    console.log(
      [
        "This writes a demo catalogue (9 products, 2 combos) and points the hero",
        "and Custom Studio images at the artwork in public/showcase.",
        "",
        "It is additive and matched on slug, so it never touches the owner's own",
        "rows — but on a live database it publishes demo products to the shop.",
        "",
        "  npm run db:showcase -- --confirm            add the showcase",
        "  npm run db:showcase -- --confirm --remove   take it back out",
      ].join("\n")
    );
    process.exitCode = 1;
    return;
  }

  if (removing) await remove();
  else await seed();

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
