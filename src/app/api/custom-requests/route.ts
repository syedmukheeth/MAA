import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { customRequestSchema } from "@/lib/validations/custom-request";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = customRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();

  await prisma.customFurnitureRequest.create({
    data: {
      ...parsed.data,
      submittedById: user?.sub,
    },
  });

  return NextResponse.json({ ok: true });
}
