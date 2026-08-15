/**
 * Clears leftover Unsplash placeholder image URLs out of the database.
 *
 * Removing the stock photos from the code was only half the job: images.unsplash.com
 * is no longer an allowed host in next.config.ts or the CSP, so any Unsplash URL
 * still sitting in a row makes next/image throw and takes the whole page down
 * with a 500. The homepage did exactly that, from SiteSettings.heroImageUrl.
 *
 * What it touches, and only where the value is an Unsplash URL:
 *   - SiteSettings.heroImageUrl        -> ""     (Hero renders a dark section)
 *   - SiteSettings.studioImageUrl      -> null   (image frame is hidden)
 *   - Product.images                   -> the Unsplash entries are dropped
 *   - Testimonial.imageUrl             -> null
 *
 * CustomFurnitureRequest.imageUrl is deliberately left alone: those are photos
 * customers uploaded with their own enquiry, not placeholders.
 *
 * Dry run by default. Pass --confirm to write.
 *
 *   npm run db:purge-images            (dry run)
 *   npm run db:purge-images -- --confirm
 */
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// See src/lib/db.ts — DATABASE_SSL=false is the local-Postgres escape hatch.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

const confirmed = process.argv.includes("--confirm");

const PLACEHOLDER_HOST = "images.unsplash.com";

function isPlaceholder(url: string | null | undefined): boolean {
  return typeof url === "string" && url.includes(PLACEHOLDER_HOST);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — pass --env-file=.env");
  }

  const settings = await prisma.siteSettings.findFirst({
    select: { id: true, heroImageUrl: true, studioImageUrl: true },
  });
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, images: true },
  });
  const testimonials = await prisma.testimonial.findMany({
    select: { id: true, name: true, imageUrl: true },
  });

  const heroHit = settings ? isPlaceholder(settings.heroImageUrl) : false;
  const studioHit = settings ? isPlaceholder(settings.studioImageUrl) : false;
  const productHits = products.filter((p) => p.images.some(isPlaceholder));
  const testimonialHits = testimonials.filter((t) => isPlaceholder(t.imageUrl));

  console.log("\nPlaceholder images found:\n");
  console.log(`  SiteSettings.heroImageUrl    ${heroHit ? "1" : "0"}`);
  console.log(`  SiteSettings.studioImageUrl  ${studioHit ? "1" : "0"}`);
  console.log(`  Product.images               ${productHits.length}`);
  for (const p of productHits) {
    console.log(`    - ${p.slug} (${p.images.filter(isPlaceholder).length} of ${p.images.length})`);
  }
  console.log(`  Testimonial.imageUrl         ${testimonialHits.length}`);
  for (const t of testimonialHits) {
    console.log(`    - ${t.name}`);
  }

  const total =
    (heroHit ? 1 : 0) + (studioHit ? 1 : 0) + productHits.length + testimonialHits.length;

  if (total === 0) {
    console.log("\nNothing to clear.\n");
    return;
  }

  if (!confirmed) {
    console.log(
      "\nDRY RUN — nothing was changed." +
        "\nRun again with --confirm to clear these values.\n"
    );
    return;
  }

  if (settings && (heroHit || studioHit)) {
    await prisma.siteSettings.update({
      where: { id: settings.id },
      data: {
        // Empty string, not null: heroImageUrl is non-nullable in the schema.
        ...(heroHit ? { heroImageUrl: "" } : {}),
        ...(studioHit ? { studioImageUrl: null } : {}),
      },
    });
  }

  for (const p of productHits) {
    await prisma.product.update({
      where: { id: p.id },
      data: { images: p.images.filter((url) => !isPlaceholder(url)) },
    });
  }

  if (testimonialHits.length > 0) {
    await prisma.testimonial.updateMany({
      where: { id: { in: testimonialHits.map((t) => t.id) } },
      data: { imageUrl: null },
    });
  }

  console.log(
    `\nCleared ${total} placeholder image reference(s).` +
      "\nProducts left without any image fall back to /placeholder-furniture.svg —" +
      "\nupload real photos at /admin/products.\n"
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
