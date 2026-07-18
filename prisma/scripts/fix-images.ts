import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  console.log("Starting image URL fix script...");

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Update Gooty Bar Counter
    const gooty = await prisma.product.updateMany({
      where: { slug: "gooty-bar-counter" },
      data: {
        images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80"],
      },
    });
    console.log(`Updated Gooty Bar Counter image: updated ${gooty.count} rows`);

    // 2. Update Ahobilam Bookshelf
    const ahobilam = await prisma.product.updateMany({
      where: { slug: "ahobilam-bookshelf" },
      data: {
        images: ["https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200&q=80"],
      },
    });
    console.log(`Updated Ahobilam Bookshelf image: updated ${ahobilam.count} rows`);
  } catch (err) {
    console.error("Error updating images in database:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
