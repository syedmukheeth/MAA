import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { executeErasure } from "@/lib/privacy/erasure";

/**
 * Runs the erasure requests whose cooling-off window has closed.
 *
 * Invoked by the Vercel cron declared in vercel.json. API routes sit outside
 * the proxy matcher (src/proxy.ts), so this endpoint is public-facing and the
 * bearer token is the only thing standing between the internet and a bulk
 * account wipe — hence the constant-time compare and the refusal to run at all
 * when CRON_SECRET is unset.
 *
 * Deliberately sequential rather than Promise.all: each erasure opens a
 * transaction and the Supabase pooler is capped at 2 connections (src/lib/db.ts).
 * A parallel sweep would exhaust it and fail halfway through a wipe.
 */
export const dynamic = "force-dynamic";

/** Safety valve: a bug that scheduled thousands must not wipe them in one run. */
const MAX_PER_RUN = 25;

function authorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Fail closed. An unset secret means "nobody may call this", never "anybody".
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  // timingSafeEqual throws on a length mismatch, and the lengths themselves are
  // not a secret, so compare them first.
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await prisma.privacyRequest.findMany({
    where: {
      type: "ERASURE",
      status: "PENDING",
      scheduledFor: { lte: new Date() },
      // userId is nullable only for public-form grievances; an erasure always
      // has one because it is created behind requireAuth(). Filtered here so
      // the type is non-null and a malformed row can never reach the wipe.
      userId: { not: null },
    },
    orderBy: { scheduledFor: "asc" },
    take: MAX_PER_RUN,
    select: { id: true, userId: true },
  });

  let erased = 0;
  let skipped = 0;
  let imagesFailed = 0;

  for (const request of due) {
    // The query filters these out; the guard is here because Prisma's `not:
    // null` does not narrow the selected type, and an unchecked `!` on the one
    // argument that decides whose data gets destroyed is not worth saving.
    if (!request.userId) {
      skipped += 1;
      continue;
    }
    try {
      const outcome = await executeErasure(request.userId);
      if (outcome.erased) {
        erased += 1;
        imagesFailed += outcome.imagesFailed;
      } else {
        skipped += 1;
      }
    } catch (err) {
      // One failing erasure must not abort the sweep — the rest are still due.
      // No identifiers in the log line: this is an erasure job, and writing the
      // user id into Vercel's log store would undo part of what it just did.
      skipped += 1;
      console.error(
        `Erasure execution failed [${err instanceof Error ? err.name : "unknown"}]`
      );
    }
  }

  return NextResponse.json({ due: due.length, erased, skipped, imagesFailed });
}
