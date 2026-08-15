/**
 * DPDP configuration that must stay consistent across the notice, the UI, the
 * consent records and the docs.
 *
 * These are deploy-time constants rather than SiteSettings rows on purpose: the
 * privacy notice text lives in a React component, so its version is a property
 * of the deploy. Putting the version in the database lets the two drift, and a
 * consent record pointing at a notice version whose text you can no longer
 * produce is worthless as evidence.
 */

/**
 * Bump this whenever the substance of /privacy changes — new data category, new
 * purpose, new processor, changed retention. Every ConsentRecord copies it at
 * grant time, so it must never be reused for different text.
 */
export const PRIVACY_NOTICE_VERSION = "2026-08-14.1";

/** Effective date shown at the top of the notice. Move it with the version. */
export const PRIVACY_NOTICE_EFFECTIVE_DATE = "14 August 2026";

/**
 * Contact point for DPDP rights and grievances (§13).
 *
 * `name` MUST be a real named individual before this ships — the Act requires
 * the notice to identify the person, not just a mailbox. The privacy page
 * renders a visible warning while it is unset rather than silently publishing a
 * placeholder, because a grievance channel nobody is accountable for is worse
 * than none.
 */
/**
 * Read from the environment so the client's own officer can be set per
 * deployment without a code change. The committed fallbacks name the developer
 * and a personal gmail address, which is correct while the site is ours and
 * wrong the moment it is the client's — DPDP §13 expects the fiduciary's own
 * accountable person, reachable at the fiduciary's own address.
 */
export const GRIEVANCE_OFFICER = {
  name: process.env.DPO_NAME || "Syed Mukheeth",
  email: process.env.DPO_EMAIL || "maafurniture.shop@gmail.com",
  /** Null falls back to SiteSettings.showroomPhone at render time. */
  phone: (process.env.DPO_PHONE || null) as string | null,
} as const;

export function isGrievanceOfficerConfigured(): boolean {
  return !GRIEVANCE_OFFICER.name.startsWith("TODO_");
}

/**
 * True while the officer is still the developer's fallback rather than the
 * client's own. Surfaced in /admin so it is visible to whoever runs the shop,
 * not only to whoever reads this file.
 */
export function isGrievanceOfficerFromEnv(): boolean {
  return Boolean(process.env.DPO_NAME && process.env.DPO_EMAIL);
}

/**
 * Days between an erasure request and the irreversible wipe.
 *
 * Not a statutory number. The account is locked the instant the request is
 * made, so the principal's data stops being used immediately; the delay exists
 * only so an accidental self-deletion can be reversed by staff. Once the wipe
 * runs, order rows are anonymised and there is no undo.
 */
export const ERASURE_COOLING_OFF_DAYS = 7;

/**
 * How long anonymised order rows are kept after erasure.
 *
 * Companies Act §128 requires books of account for 8 years; CGST §36 requires
 * 72 months from the annual-return due date. We apply the longer of the two.
 * See docs/privacy/03-retention-schedule.md — the exact figure is flagged for
 * legal review.
 */
export const ORDER_RETENTION_YEARS = 8;

/** Response commitment published in the notice and shown on the grievance form. */
export const GRIEVANCE_SLA_DAYS = 30;

/**
 * Days after which an open request is flagged in the admin queue. Deliberately
 * short of the SLA — the 30-day deadline is the thing that actually gets
 * missed, and a badge that appears on day 30 is a badge that appears too late.
 */
export const PRIVACY_REQUEST_WARN_DAYS = 20;

/** Sentinel written over erased text columns. Grep-able, obviously not real. */
export const ERASED_PLACEHOLDER = "[erased]";

/**
 * Written over passwordHash on erasure.
 *
 * Not a bcrypt hash of anything, so bcrypt.compare returns false for every
 * input. Deliberately NOT a hash of a random string: that would leave a
 * credential which is theoretically valid for someone who guesses it.
 */
export const ERASED_PASSWORD_HASH = "!erased";

/** Non-routable per RFC 2606 — a stray send bounces locally instead of at a real inbox. */
export const ERASED_EMAIL_DOMAIN = "erased.invalid";

/**
 * Order states that block erasure: the contract is still live, so the shipping
 * details are still needed to perform it (DPDP §12(3)).
 */
export const OPEN_ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
] as const;
