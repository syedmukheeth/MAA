import { PrismaClient, type RoomCategory } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Fills the storefront with a showcase catalogue so the site can be demoed,
 * screenshotted and handed over before the owner has photographed a single
 * piece.
 *
 * The images are the hand-drawn artwork in public/showcase, rendered by
 * scripts/generate-showcase-art.mjs — Indian forms (carved teak sofa, jhoola,
 * jali almirah, puja mandir) in the brand palette. Drawn as SVG, shipped as
 * WEBP, because next/image will not optimise SVG without a config flag that
 * would also cover admin uploads.
 *
 * They are deliberately NOT photographs: a photo of furniture
 * this shop did not build, presented as its catalogue, is the exact problem the
 * Unsplash placeholders were removed for (see the comment on heroImageUrl in
 * src/lib/site-settings.ts and the remotePatterns note in next.config.ts).
 * Artwork reads as artwork, so nothing here can be mistaken for a real product
 * photo — and every row it writes is an ordinary admin-editable row, so the
 * owner replaces each one from /admin as their own photos arrive.
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
    slug: "kurnool-jhoola-swing",
    name: "Kurnool Jhoola Swing",
    description:
      "The indoor swing that belongs in a verandah or a wide living room. Carved teak seat and jali backrest, hung on solid brass chains rated well past the 200 kg seat load, with a cushioned seat in cotton silk.",
    price: "38999",
    mrp: "47999",
    category: "LIVING_ROOM",
    materials: ["Teak wood", "Solid brass chain", "Cotton silk cushion"],
    dimensions: 'Seat 60" x 22" · Backrest height 26" · Chain drop adjustable',
    images: [`${IMG}/wooden-jhoola-swing.webp`],
    stockQuantity: 4,
    featured: true,
    variants: [
      {
        name: "Teak · Brass Chain",
        woodType: "Teak",
        finish: "Natural",
        priceDelta: "0",
        sku: "MAA-JHOOLA-TEAK-BR",
        stock: 3,
        isDefault: true,
      },
      {
        name: "Sheesham · Brass Chain",
        woodType: "Sheesham",
        finish: "Deep Brown",
        priceDelta: "-3000",
        sku: "MAA-JHOOLA-SHSM-BR",
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
    slug: "tirumala-puja-mandir",
    name: "Tirumala Puja Mandir",
    description:
      "A temple unit in teak with a turned dome, jali side panels and hanging brass bells. Two drawers below for samagri, and a pull-out shelf for the thali. Finished on all sides so it can stand free of a wall.",
    price: "24999",
    mrp: "31999",
    category: "LIVING_ROOM",
    materials: ["Teak wood", "Brass bells", "Brass kalash finial"],
    dimensions: '30" x 18" x 60"',
    images: [`${IMG}/teak-puja-mandir.webp`],
    stockQuantity: 7,
    featured: false,
    variants: [
      {
        name: "Floor Standing · Teak",
        woodType: "Teak",
        finish: "Honey",
        size: "Floor Standing",
        priceDelta: "0",
        sku: "MAA-MANDIR-FLR-TEAK",
        stock: 5,
        isDefault: true,
      },
      {
        name: "Wall Mounted · Teak",
        woodType: "Teak",
        finish: "Honey",
        size: "Wall Mounted",
        priceDelta: "-6000",
        sku: "MAA-MANDIR-WAL-TEAK",
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
    slug: "sheesham-study-desk",
    name: "Sheesham Study Desk",
    description:
      "A working desk, not a console: three deep drawers on a solid bank, a 1200 mm clear top and a cable cut-out at the back. Carved drawer fronts with brass pulls. Matching cane-back chair included.",
    price: "27999",
    mrp: "33999",
    category: "OFFICE",
    materials: ["Sheesham wood", "Brass pulls", "Natural cane"],
    dimensions: '48" x 24" x 30" · Chair 18" x 18" x 38"',
    images: [`${IMG}/sheesham-study-desk.webp`],
    stockQuantity: 6,
    featured: false,
    variants: [
      {
        name: "With Chair",
        woodType: "Sheesham",
        finish: "Deep Brown",
        priceDelta: "0",
        sku: "MAA-DESK-CHAIR",
        stock: 4,
        isDefault: true,
      },
      {
        name: "Desk Only",
        woodType: "Sheesham",
        finish: "Deep Brown",
        priceDelta: "-5000",
        sku: "MAA-DESK-ONLY",
        stock: 2,
      },
    ],
  },
  {
    slug: "konaseema-cane-outdoor-set",
    name: "Konaseema Cane Outdoor Set",
    description:
      "Handwoven cane over a teak frame — two armchairs and a low table for a balcony or a terrace. The weave is hand-pulled and re-caneable, so the set is repairable rather than disposable.",
    price: "32999",
    mrp: "39999",
    category: "OUTDOOR",
    materials: ["Teak frame", "Handwoven cane", "Outdoor cotton cushions"],
    dimensions: 'Chairs 30" x 30" x 34" · Table 36" x 20" x 18"',
    images: [`${IMG}/cane-outdoor-set.webp`],
    stockQuantity: 5,
    featured: false,
    variants: [
      {
        name: "2 Chairs + Table",
        woodType: "Teak",
        finish: "Natural",
        size: "2 Seater",
        priceDelta: "0",
        sku: "MAA-CANE-2-TBL",
        stock: 4,
        isDefault: true,
      },
      {
        name: "4 Chairs + Table",
        woodType: "Teak",
        finish: "Natural",
        size: "4 Seater",
        priceDelta: "18000",
        sku: "MAA-CANE-4-TBL",
        stock: 1,
      },
    ],
  },
];

const COMBOS = [
  {
    slug: "drawing-room-complete",
    name: "Drawing Room, Complete",
    description:
      "The sofa set, the jhoola and the puja mandir, bought together. One delivery, one installation visit, and the finishes are matched across all three pieces at the workshop before they leave.",
    bundlePrice: "139999",
    image: `${IMG}/combo-living-room.webp`,
    items: [
      { slug: "marwar-carved-teak-sofa-set", quantity: 1 },
      { slug: "kurnool-jhoola-swing", quantity: 1 },
      { slug: "tirumala-puja-mandir", quantity: 1 },
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

  console.log("\nCombos");
  for (const c of COMBOS) {
    const { items, ...fields } = c;
    const combo = await prisma.combo.upsert({
      where: { slug: c.slug },
      update: { ...fields, isActive: true },
      create: { ...fields, createdById: owner.id },
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
  const slugs = PRODUCTS.map((p) => p.slug);
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
        "This writes a demo catalogue (8 products, 2 combos) and points the hero",
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
