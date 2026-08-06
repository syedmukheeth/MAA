import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveUser } from "@/lib/auth/session";
import { customRequestSchema } from "@/lib/validations/custom-request";
import { customRequestRatelimit } from "@/lib/redis";
import { sendEmail } from "@/lib/email";
import { customRequestNotificationHtml } from "@/lib/email-templates";

async function clientIp() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  // CSRF: API routes (unlike server actions) lack built-in origin checking.
  // Verify the Origin header matches our own host to block cross-site POSTs.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: "Cross-origin requests are not allowed." },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }
  }

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

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 100 * 1024) {
    return NextResponse.json(
      { error: "Payload too large. Maximum size allowed is 100KB." },
      { status: 413 }
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

  const user = await getActiveUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please log in to submit a custom furniture request.", requiresAuth: true },
      { status: 401 }
    );
  }

  const created = await prisma.customFurnitureRequest.create({
    data: {
      ...parsed.data,
      submittedById: user.sub,
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
