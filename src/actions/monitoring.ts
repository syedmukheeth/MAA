"use server";

import { headers } from "next/headers";
import { captureError } from "@/lib/monitoring/errors";
import { clientErrorRatelimit } from "@/lib/redis";
import { clientIp, limitOrAllow } from "@/lib/rate-limit";

/**
 * Client-side error reporting, called from the React error boundaries.
 *
 * This is an unauthenticated, publicly reachable endpoint that writes to the
 * database, so it is rate-limited per IP. Without that it is a free write
 * amplifier: anyone could POST fabricated errors in a loop and fill the table.
 * Grouping by fingerprint limits the damage — a flood of identical junk is one
 * row — but varied junk would still grow it.
 *
 * Only the message and the boundary digest are accepted. Client stacks are
 * minified to the point of uselessness in production, and accepting an
 * arbitrary caller-supplied stack means accepting arbitrary text into a table
 * staff read.
 */
export async function reportClientError(input: {
  message: string;
  digest?: string;
}): Promise<void> {
  try {
    const allowed = await limitOrAllow(
      clientErrorRatelimit,
      `client-error:${await clientIp()}`
    );
    if (!allowed) return;

    const message =
      typeof input.message === "string" ? input.message.slice(0, 1000) : "";
    if (!message) return;

    // The referer is the page the boundary caught the error on. Taken from the
    // header rather than trusted from the caller, and scrubbed downstream.
    const referer = (await headers()).get("referer");
    let route: string | null = null;
    if (referer) {
      try {
        route = new URL(referer).pathname;
      } catch {
        route = null;
      }
    }

    await captureError({
      source: "CLIENT",
      error: Object.assign(
        new Error(input.digest ? `${message} [digest ${input.digest}]` : message),
        { name: "ClientError" }
      ),
      route,
    });
  } catch {
    // A failure to report an error must never itself surface to the user, who
    // is already looking at an error screen.
  }
}
