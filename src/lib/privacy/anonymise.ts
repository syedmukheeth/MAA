import {
  ERASED_EMAIL_DOMAIN,
  ERASED_PASSWORD_HASH,
  ERASED_PLACEHOLDER,
} from "./constants";

/**
 * What an erasure actually writes, as pure functions.
 *
 * Split out from the transaction in actions/privacy.ts for one reason: this is
 * the part that must not silently change. The transaction ordering is checkable
 * by reading it; "does shippingState survive?" is not, and getting it wrong is
 * either a compliance failure or a broken GST record. These are unit-tested in
 * anonymise.test.ts against the exact field list.
 *
 * The rule throughout: destroy what identifies a person, keep what a statute
 * or a warranty obligation requires. See docs/privacy/05-erasure-runbook.md.
 */

/**
 * The User row survives as a pseudonymous FK anchor.
 *
 * Order.userId, Cart.userId and AuditLog.actorId are all onDelete: Restrict,
 * and orders are a statutory accounting record, so the row cannot be deleted
 * without destroying books of account. What is removed is everything that
 * points at a human.
 */
export function tombstoneUserFields(userId: string, now: Date = new Date()) {
  return {
    name: "Deleted user",
    // Frees the real address for re-registration and keeps the @unique index
    // satisfied. .invalid is non-routable (RFC 2606), so a stray send fails
    // locally rather than reaching a stranger who later took the address.
    email: `erased-${userId}@${ERASED_EMAIL_DOMAIN}`,
    // Not a bcrypt hash of anything, so compare() is false for every input.
    // Deliberately not a hash of a random string — that leaves a credential
    // which is valid for whoever guesses it.
    passwordHash: ERASED_PASSWORD_HASH,
    isActive: false,
    erasedAt: now,
    // Invalidates every JWT still in the wild, including the 7-day cookie the
    // principal was holding when they asked.
    tokenVersion: { increment: 1 },
  };
}

/**
 * Orders keep their money, dates and place of supply; they lose the recipient.
 *
 * `shippingState` is the GST place of supply — removing it makes the invoice
 * non-compliant, so it stays. `shippingCity` stays as the smallest unit that
 * still supports a state-level audit. `shippingPincode` goes: a pincode plus an
 * order value is a strong re-identifier and is not needed for place of supply.
 * (That last call is flagged for tax review in docs/privacy/03.)
 *
 * `cancelReason` and `refundNotes` are staff free text and have been observed
 * to contain customer names and phone numbers, so both are nulled.
 * `refundTxnId` is a bank/PSP reference, not personal data on its own, and is
 * needed to reconcile — it stays.
 */
export function anonymisedOrderFields() {
  return {
    shippingName: ERASED_PLACEHOLDER,
    shippingPhone: ERASED_PLACEHOLDER,
    shippingLine1: ERASED_PLACEHOLDER,
    shippingLine2: null,
    shippingPincode: "000000",
    cancelReason: null,
    refundNotes: null,
  };
}

/**
 * A CONVERTED custom request is the build spec behind a piece of furniture that
 * exists in someone's house, so dimensions, wood, finish and options survive
 * for warranty and dispute purposes. The identity behind the spec does not.
 *
 * Requests in every other status are deleted outright by the caller — a
 * pre-contract enquiry has no retention basis at all.
 */
export function anonymisedCustomRequestFields() {
  return {
    name: ERASED_PLACEHOLDER,
    phone: ERASED_PLACEHOLDER,
    description: null,
    imageUrl: null,
    inspirationUrl: null,
    submittedById: null,
  };
}

/** True once tombstoneUserFields has been applied. Used to gate login and UI. */
export function isErasedUser(user: { erasedAt: Date | null }): boolean {
  return user.erasedAt !== null;
}

/**
 * Partially hides an email for staff-facing lists.
 *
 * The admin privacy queue needs to distinguish two requests from two people
 * without turning the queue into a customer directory. Keeps the first two
 * characters and the domain: enough to match against a support conversation,
 * not enough to contact someone you had no reason to contact.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return `${local[0] ?? ""}***${domain}`;
  return `${local.slice(0, 2)}***${domain}`;
}
