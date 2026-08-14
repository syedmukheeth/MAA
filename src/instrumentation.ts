import type { Instrumentation } from "next";

/**
 * Server-side error capture.
 *
 * Next calls `onRequestError` for every uncaught error in a server render, a
 * server action or a route handler — which is the whole server surface without
 * having to wrap anything by hand. Before this existed, the application's only
 * response to an unhandled server error was a `console.error` that nobody read.
 *
 * The import is dynamic on purpose: this module is loaded in every runtime,
 * including edge, and `lib/monitoring/errors` pulls in Prisma. A static import
 * would drag the Postgres driver into a runtime that cannot use it.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  // The edge runtime has no Prisma. Errors there are rare (the proxy is the
  // only edge code) and are left to platform logs rather than pulling a
  // database client into an environment that cannot host one.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { captureError } = await import("@/lib/monitoring/errors");
    await captureError({
      // A failure inside a scheduled job matters more than one on a page,
      // because nobody is looking at a screen when it happens.
      source: context.routePath?.startsWith("/api/privacy/") ? "CRON" : "SERVER",
      error,
      // `request.path` includes the query string; scrubRoute strips it, since
      // query strings are where identifiers end up.
      route: request.path ?? context.routePath ?? null,
    });
  } catch {
    // Never let instrumentation throw. It runs while the request is already
    // failing, and a second error here would replace the original.
  }
};
