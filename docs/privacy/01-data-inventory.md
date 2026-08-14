# Data inventory

Every field in the database that holds personal data, why it exists, and whether
it is actually necessary. Schema reference: `prisma/schema.prisma`.

Non-personal models (`Product`, `Variant`, `Combo`, `ComboItem`,
`ComboItemOption`, `OrderItem`, `SiteSettings`) are omitted. `SiteSettings` holds
the *business's own* contact details, which are published deliberately.

---

## User — `prisma/schema.prisma`

| Field | Personal? | Purpose | Collected at | Necessary? |
|---|---|---|---|---|
| `id` | pseudonymous | FK anchor | generated | Yes |
| `name` | **Yes** | Addressing the customer in the UI and in emails | `/register` | Yes |
| `email` | **Yes** | Login identifier; order and password-reset emails | `/register` | Yes |
| `passwordHash` | **credential** | Authentication. bcrypt, 12 rounds | `/register` | Yes |
| `role` | No | RBAC | assigned | Yes |
| `isActive` | No | Suspension / erasure lock | staff or erasure | Yes |
| `tokenVersion` | No | Session revocation | system | Yes |
| `erasedAt` | No | Erasure tombstone marker | erasure | Yes |

**Who can see it:** the account holder; OWNER and ADMIN via `/admin/users`
(explicitly `select`ed — see [07](./07-security-controls.md)).

## Address — reusable delivery addresses

`label`, `name`, `phone`, `line1`, `line2`, `city`, `state`, `pincode`,
`isDefault`. Collected at `/account` (`AddressManager`) and optionally saved from
checkout. Max 10 per user (`src/actions/addresses.ts`).

**Necessary:** yes — this is the delivery address, and the phone number is what
the driver calls. **Deleted:** immediately and completely on erasure, and by the
customer at any time.

## Order — the shipping snapshot

`shippingName`, `shippingPhone`, `shippingLine1`, `shippingLine2`,
`shippingCity`, `shippingState`, `shippingPincode`, plus `cancelReason`,
`refundNotes`, `refundTxnId`.

This duplicates `Address` **on purpose**. It is not redundancy — it is a
point-in-time record of where an invoice was delivered, which is what a tax
record requires. Editing a saved address must not silently rewrite history on a
past invoice.

**Retention:** 8 years, then anonymised. On erasure the recipient fields are
destroyed and `shippingCity` / `shippingState` survive — see
[03](./03-retention-schedule.md) and [05](./05-erasure-runbook.md).

`cancelReason` and `refundNotes` are staff free text and **have been observed to
contain customer names and phone numbers**. Both are nulled on erasure. Staff
should not type customer contact details into them.

## CustomFurnitureRequest

`name`, `phone`, `inspirationUrl`, `imageUrl`, `dimensions`, `wood`, `finish`,
`budgetRange`, `description` (≤3000 chars), `customOptions`, `submittedById`.
Collected at `/custom-studio` (authenticated).

**`phone` is flagged, not removed.** The submitter is already a signed-in user
with an email on file, so strictly the phone number is redundant collection.
It is kept because quoting bespoke furniture in this market happens by phone,
and removing it would break a working sales funnel to save a field the customer
expects to give. It is disclosed in the notice as "we call you to quote".
**This is a judgement call and is recorded as such.**

`description` is free text, which is where personal data nobody asked for
arrives. The field is not shortened; the placeholder now discourages it.

`imageUrl` points at Cloudinary and may be a photograph of the customer's home.
Purged on erasure via `destroyUpload` (`src/lib/cloudinary.ts`).

## Testimonial

`name`, `location`, `quote`, `rating`, `imageUrl`, `subjectUserId`,
`consentRecordId`. Entered by **staff**, about a customer.

This is the only place the application publishes a named individual. It now
requires a recorded `ConsentRecord` before `isPublished` can be set true — see
[06](./06-consent-and-testimonials.md). `location` is capped at 40 characters
and the form asks for a city, not an area: "Sai Nagar, Kurnool" next to a name
and photograph narrows a stranger to a few hundred households.

## AuditLog

`actorId`, `action`, `entity`, `entityId`, `summary`, `metadata`.

**Changed in this work:** `summary` and `metadata` previously embedded the
target user's email address (`src/actions/users.ts`). They now carry the user
id, which `entityId` already holds. The admin UI joins to `User` for display.

Rows about an erased user have `summary` replaced and `targetEmail` stripped
from `metadata`; the row itself survives because it is the internal control over
staff activity.

## ConsentRecord *(new)*

`userId`, `purpose`, `status`, `grantedAt`, `withdrawnAt`, `noticeVersion`,
`source`. Append-only. Contains no personal data beyond the user id.

Survives erasure (flipped to `WITHDRAWN`) as evidence of the basis we processed
on. Deleting it would destroy our own defence.

## PrivacyRequest *(new)*

`userId` (nullable), `contactEmail` (nullable), `type`, `status`, `note`,
`resolution`, `requestedAt`, `scheduledFor`, `completedAt`.

`contactEmail` is populated **only** for grievances raised from the public page
by someone with no account — without it there is no way to answer them. When the
address matches an existing account the row attaches to that account instead, so
the address is not stored twice. A DB check constraint requires one or the other.

`note` is the principal's own words and can contain anything they chose to write.

## SecurityEvent *(new)*

`type`, `severity`, `ipHash`, `userId`, `summary`, `metadata`, `alertedAt`,
`createdAt`.

Breach detection telemetry. **Deliberately built so it is not itself a personal
data store**: it holds a keyed HMAC of the client IP rather than the address,
and a user id rather than an email. `hashIp` returns null rather than falling
back to an unkeyed digest if `JWT_SECRET` is missing — the IPv4 space is small
enough to enumerate, so a bare hash of an IP is reversible and would still be
personal data.

`userId` has **no foreign key** on purpose: a failed login can name an address
with no account behind it, and a security log must never become the reason a
user row cannot be removed.

`summary` is written to be safe in an alert email and never contains personal
data. Retention 730 days, swept nightly.

## ErrorEvent *(new)*

`fingerprint`, `source`, `message`, `name`, `route`, `stack`, `occurrences`,
`firstSeenAt`, `lastSeenAt`, `resolvedAt`, `alertedAt`.

Application errors, grouped by fingerprint. **Holds no user id, IP or session
identifier at all** — unlike `SecurityEvent`, which needs a keyed IP hash to
correlate attacks, error tracking needs no identity to be useful.

Messages, stacks and routes are scrubbed at capture
(`src/lib/monitoring/scrub.ts`) because the errors most worth keeping are the
ones carrying personal data — a Prisma failure in `placeOrder` interpolates the
customer's shipping name, phone and address into its message. Redaction is by
pattern and therefore best-effort; see
[11-monitoring.md](./11-monitoring.md). Retention 90 days.

## StockMovement.byUserId — known gap

A bare `String?` with no foreign key, recording which staff member moved stock.
It is not a customer field and survives erasure as an orphaned identifier.
Documented rather than fixed: adding an FK to a historical stock ledger is a
larger change than the privacy benefit justifies, and the ids belong to staff.

## Data that is NOT collected

No date of birth, gender, precise location, government ID, payment card, browser
fingerprint, or third-party-enriched profile. No analytics or advertising
identifiers of any kind — verified by the absence of `gtag`, `googletagmanager`,
`@vercel/analytics`, `posthog` and `next/script` anywhere in `src/`.

## Transient data

| What | Where | Lifetime |
|---|---|---|
| IP address, login email | Upstash Redis rate-limit keys | ≤1 hour (TTL) |
| Email address | Upstash Redis password-reset token | 1 hour |
| Session JWT (`sub`, `email`, `role`, `tv`) | `maa_session` httpOnly cookie | 7 days |
| Wishlist product ids | browser `localStorage` (`maa-wishlist`) | until cleared; **never sent to us** |

The session JWT carries the user's email. Removing it is correct minimisation
but touches the authentication path and was deliberately deferred — see
[07](./07-security-controls.md).
