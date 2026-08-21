import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveUser } from "@/lib/auth/session";
import { customRequestSchema } from "@/lib/validations/custom-request";
import { customRequestRatelimit } from "@/lib/redis";
import { sendEmail } from "@/lib/email";
import { customRequestNotificationHtml } from "@/lib/email-templates";

export async function POST(request: Request) {
  // CSRF: API routes (unlike server actions) lack built-in origin checking.
  // Verify the Origin header matches our own host to block cross-site POSTs.
  // A missing Origin is a failure, not a pass. Browsers send it on every
  // cross-site POST, so the only callers without one are non-browser clients —
  // and letting those through means the check is not the control it claims to
  // be. Absent, unparseable and mismatched are all refused.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }
  try {
    if (new URL(origin).host !== host) {
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

  // Rate limited per ACCOUNT, and deliberately after the auth check even though
  // the usual rule is to limit before doing work.
  //
  // Everything above this line is cheap and side-effect free (header checks, a
  // 100KB-capped parse, one cookie verify); the expensive part — the DB write
  // and an email to every OWNER and ADMIN — is below, and is what the limit is
  // protecting. Keyed per IP and placed before the auth check, as it was, an
  // unauthenticated stranger could burn the 5/hour bucket for a shared office
  // or mobile-carrier NAT address and lock every real customer behind it out of
  // the form, without ever being able to send a single email themselves.
  let allowed: boolean;
  try {
    ({ success: allowed } = await customRequestRatelimit.limit(
      `custom-request:${user.sub}`
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
