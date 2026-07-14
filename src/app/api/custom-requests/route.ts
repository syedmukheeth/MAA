import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { customRequestSchema } from "@/lib/validations/custom-request";
import { sendEmail } from "@/lib/email";
import { customRequestNotificationHtml } from "@/lib/email-templates";

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

  const created = await prisma.customFurnitureRequest.create({
    data: {
      ...parsed.data,
      submittedById: user?.sub,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: ["OWNER", "ADMIN"] } },
    select: { email: true },
  });

  await Promise.all(
    admins.map((admin) =>
      sendEmail({
        to: admin.email,
        subject: `New custom furniture request from ${created.name}`,
        html: customRequestNotificationHtml(created),
      })
    )
  );

  return NextResponse.json({ ok: true });
}
