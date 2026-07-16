import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { customRequestSchema } from "@/lib/validations/custom-request";
import { customRequestRatelimit } from "@/lib/redis";
import { sendEmail } from "@/lib/email";
import { customRequestNotificationHtml } from "@/lib/email-templates";

async function clientIp() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  // Rate limit before parsing or touching the DB. This route is public (it is
  // not in the proxy matcher) and every accepted request emails every OWNER and
  // ADMIN — unlimited, it is an email amplifier aimed at our own staff.
  let allowed: boolean;
  try {
    ({ success: allowed } = await customRequestRatelimit.limit(
      `custom-request:${await clientIp()}`
    ));
  } catch {
    // Fail closed. If the limiter is unavailable we cannot bound the fan-out,
    // and a briefly broken form beats an unbounded inbox flood.
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  }

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

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
    where: { role: { in: ["OWNER", "ADMIN"] }, isActive: true },
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
