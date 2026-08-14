import type { ConsentPurpose } from "@/generated/prisma/enums";

/**
 * Human-readable consent copy, in a module with NO database import.
 *
 * Deliberately separate from consent.ts. That file imports `prisma`, so a
 * client component pulling a label string from it drags the Postgres driver
 * into the browser bundle — which is not a type error and not a lint error, it
 * is a build failure (`node:module` cannot be bundled for the client) or, worse
 * on a looser setup, a silent 200 KB of server code shipped to users.
 *
 * Import types from `@/generated/prisma/enums`, not from the client entrypoint,
 * for the same reason.
 */

export const CONSENT_PURPOSE_LABELS: Record<ConsentPurpose, string> = {
  MARKETING_EMAIL: "Marketing emails about new arrivals and offers",
  TESTIMONIAL_PUBLICATION: "Publishing your testimonial with your name on our site",
};

export const CONSENT_PURPOSE_DESCRIPTIONS: Record<ConsentPurpose, string> = {
  MARKETING_EMAIL:
    "We email you when new furniture arrives or there is an offer. Turning this off never affects your orders or your account.",
  TESTIMONIAL_PUBLICATION:
    "We show your review, your first name and (if you gave one) your city and photo on our website. Turning this off removes it from the site.",
};
