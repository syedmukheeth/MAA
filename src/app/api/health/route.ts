import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Perform a lightweight query to verify DB connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
      },
      { status: 503 }
    );
  }
}
