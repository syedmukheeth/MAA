# Retention schedule

DPDP §8(7) requires personal data to be erased once the purpose is served and
retention is no longer required by law. Nothing in this application is retained
indefinitely by default.

| Category | Retention | Basis | Deletion mechanism |
|---|---|---|---|
| Account (`User.name`, `email`, `passwordHash`) | Life of the account | Contract | Tombstoned on erasure; `User` row survives as a pseudonymous FK anchor |
| Saved addresses | Life of the account, or until the customer deletes one | Contract | Hard `deleteMany` on erasure; customer-deletable any time at `/account` |
| Cart contents | Life of the account | Contract | Hard delete on erasure |
| **Order shipping details** | **8 years from the order** | **Companies Act §128 / CGST §36** | Anonymised in place — see below |
| Order amounts, dates, `orderNumber`, GST fields | 8 years | Statutory books of account | Not deleted; contain no personal data after anonymisation |
| Custom enquiry — not converted | Until the enquiry closes | Pre-contractual | Hard `deleteMany` on erasure; **no automatic sweep — see gap below** |
| Custom enquiry — converted to an order | Build spec kept for warranty; identity removed | Warranty / dispute | Identity fields anonymised on erasure |
| Uploaded images (Cloudinary) | With the record that references them | Same as parent | `destroyUpload()` after the erasure transaction commits |
| Testimonial | Until consent is withdrawn | Consent | Unpublished immediately on withdrawal; deleted on erasure |
| `ConsentRecord` | Life of the account + 8 years | Evidence of lawful basis (§6(1) burden of proof) | Flipped to `WITHDRAWN` on erasure, rows retained |
| `PrivacyRequest` | Life of the account + 8 years | Evidence that requests were honoured | Retained; erasure `note` scrubbed if it held personal data |
| `AuditLog` | 8 years | Internal control | Rows about an erased user have `summary` replaced and `targetEmail` stripped |
| Rate-limit counters (IP, email) | ≤1 hour | Security | Redis TTL — self-expiring, no action needed |
| Password-reset token | 1 hour | Security | Redis TTL; also deleted on use |
| Session cookie | 7 days | Authentication | Browser expiry; invalidated early by `tokenVersion` |
| Wishlist | Until the customer clears it | — | `localStorage` on their own device; never transmitted to us |

## Why orders are anonymised rather than deleted

An order is simultaneously the customer's personal data and the company's book
of account. Deleting it satisfies the first and breaks the second.

The resolution is to destroy the identifying half and keep the accounting half:

**Destroyed:** `shippingName`, `shippingPhone`, `shippingLine1`,
`shippingLine2`, `shippingPincode`, `cancelReason`, `refundNotes`.

**Kept:** `shippingCity`, `shippingState` (the GST *place of supply* — removing
it makes the invoice non-compliant), all amounts, tax fields, dates,
`orderNumber`, `refundTxnId`.

Implemented in `anonymisedOrderFields()` (`src/lib/privacy/anonymise.ts`) and
asserted field-by-field in `anonymise.test.ts`.

## The 8-year figure — REQUIRES LEGAL REVIEW

Two statutes give different answers:

- **Companies Act 2013 §128(5)** — books of account for **8 financial years**
  preceding the current one.
- **CGST Act 2017 §36** — records for **72 months** from the due date of the
  annual return for that year.

These produce different end dates. We apply the longer (8 years) throughout,
in `ORDER_RETENTION_YEARS` (`src/lib/privacy/constants.ts`). A tax adviser
should confirm this is the right reading for a business of this form.

## Pincode erasure — REQUIRES LEGAL REVIEW

We erase `shippingPincode`. Rationale: a pincode plus an order value is a strong
re-identifier, and place of supply is determined by state, not pincode.

A tax adviser may take the view that the full recipient address must survive for
the retention period. If so it is a one-line change in
`anonymisedOrderFields()`, and `anonymise.test.ts` will need its assertion
flipped.

## Known gaps — no automatic sweep

The following have a defined retention period but **no scheduled job** to
enforce it. They are only cleaned up when a specific customer requests erasure.

1. **Closed custom enquiries.** A `CLOSED` or `QUOTED` request that never became
   an order sits indefinitely with a name and phone number on it.
2. **Orders past 8 years.** Nothing yet anonymises an order simply because it
   has aged out. The business is not old enough for this to bite, but it will.
3. **Old `AuditLog` rows.** Retained indefinitely today.

The cron infrastructure to fix these now exists
(`src/app/api/privacy/execute-erasures/route.ts` is the pattern, `vercel.json`
declares the schedule). Adding a retention sweep is a contained follow-up and is
listed as **PARTIALLY COMPLIANT** in
[10-dpdp-compliance-checklist.md](./10-dpdp-compliance-checklist.md).

## DPDP Rules 2025 Rule 8 — inactivity erasure

The Rules require certain classes of data fiduciary to erase personal data after
**3 years of inactivity**, with 48 hours' notice to the principal. The classes
are defined by user-count thresholds that a single-showroom furniture retailer is
very unlikely to meet.

**REQUIRES LEGAL REVIEW** — confirm MAA FURNITURE is out of scope. If it is in
scope, an inactivity sweep plus a notice email is a further feature, not a
configuration change.
