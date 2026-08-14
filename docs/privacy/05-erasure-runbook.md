# Erasure runbook

What deleting an account actually does, in what order, and what to do when part
of it fails.

**Code:** `src/actions/privacy.ts` (request) · `src/lib/privacy/erasure.ts`
(execution) · `src/lib/privacy/anonymise.ts` (field mapping) ·
`src/app/api/privacy/execute-erasures/route.ts` (cron).

---

## Step A — the request

Triggered by the customer at `/account/privacy`.

1. `requireAuth()`
2. Rate limit — 5 per 24h per user
3. **Current password required.** A session alone must not be enough: a borrowed
   browser or stolen cookie would otherwise convert into permanent destruction
   the real owner cannot undo.
4. **CUSTOMER role only.** Staff erasure needs the last-owner guard, role
   handover and audit-authorship considerations — not a self-service button.
5. **Open orders → `ON_HOLD`.** If any order is `PENDING`, `CONFIRMED`, `PACKED`
   or `SHIPPED`, the contract is live and we still need the address to perform
   it (DPDP §12(3)). The request is *recorded*, not refused; the customer is
   told they need not ask again.
6. Otherwise: create `PrivacyRequest{ ERASURE, PENDING, scheduledFor: +7 days }`,
   set `isActive = false`, bump `tokenVersion`, email the customer, clear the
   session cookie.

The account is **locked immediately**. The 7-day window protects against an
accidental deletion; it is not a window in which we keep using the data.

## Step B — execution

Runs from the nightly cron at 03:00, or from the OWNER "Erase now" override.

**Before the transaction:** re-load the user, re-check role and open orders (an
order can have been placed since the request), and capture two things that will
not survive it — `originalEmail` and the list of Cloudinary URLs.

**Inside `prisma.$transaction`:**

```
 1  cartComboSelection.deleteMany   (where cartItem.cart.userId)
 2  cartItem.deleteMany
 3  cart.deleteMany                  <- Cart.user has NO onDelete: it is Restrict
 4  address.deleteMany
 5  customFurnitureRequest.deleteMany   (status NOT 'CONVERTED')
 6  customFurnitureRequest.updateMany   (anonymise what remains)
 7  testimonial.deleteMany              (subjectUserId)
 8  order.updateMany                    (anonymise)
 9  $executeRaw  AuditLog summary + metadata scrub
10  consentRecord.updateMany            (GRANTED -> WITHDRAWN, rows kept)
11  privacyRequest.updateMany           (-> COMPLETED)
12  user.update                         (tombstone)            <- LAST
13  recordAudit(privacy.erasure_complete, tx)
```

### Why the order is what it is

- **5 before 6.** Delete the disposable rows first, then anonymise the
  remainder. Reversed, step 6 rewrites rows step 5 is about to delete.
- **12 last.** `Order.userId`, `Cart.userId` and `AuditLog.actorId` are all
  `onDelete: Restrict`. Because the `User` row is *updated* and never deleted,
  every FK stays satisfied and **no schema `onDelete` change was needed
  anywhere**.
- **13 inside the transaction.** `recordAudit` accepts a `tx`, so the log lands
  or rolls back with the wipe it describes. `actorId` resolves against the row
  tombstoned one statement earlier.
- **9 is raw SQL** because Prisma cannot delete a single key from a JSONB column.

### After the transaction — never inside it

1. `destroyUpload()` per Cloudinary URL. An external HTTP call inside a Prisma
   transaction pins a pooler connection (capped at 2) for the round trip and
   cannot be rolled back anyway. More importantly, a Cloudinary outage must not
   be reported to the principal as a failed erasure when their database records
   are already gone.
2. Confirmation email to `originalEmail` — captured before the transaction,
   because afterwards it is `erased-<id>@erased.invalid`.
3. Any purge failure writes `privacy.erasure_purge_failed` so `/admin/privacy`
   can surface it and offer a retry.

## Field-by-field

| Model | Treatment |
|---|---|
| `User.name` | → `"Deleted user"` |
| `User.email` | → `erased-<id>@erased.invalid` — satisfies `@unique`, frees the real address for re-registration, non-routable per RFC 2606 |
| `User.passwordHash` | → `"!erased"` — not a bcrypt hash, so `compare()` is false for every input. **Deliberately not a hash of a random string**, which would leave a guessable credential |
| `User.isActive` | → `false`; `tokenVersion` incremented (kills every live JWT) |
| `Address` | hard delete |
| `Cart` / `CartItem` / `CartComboSelection` | hard delete |
| `Order` shipping name/phone/line1 | → `"[erased]"`; line2 → null; pincode → `"000000"` |
| `Order` city / state / money / dates / orderNumber / refundTxnId | **retained** |
| `Order.cancelReason` / `refundNotes` | → null (staff free text, seen to contain PII) |
| `CustomFurnitureRequest` not CONVERTED | row deleted |
| `CustomFurnitureRequest` CONVERTED | identity anonymised; dimensions / wood / finish / customOptions kept for warranty |
| Cloudinary images | `uploader.destroy` |
| `Testimonial` (subjectUserId) | row deleted, image destroyed |
| `AuditLog` about the user | `summary` → `[erased]`, `targetEmail` stripped; row kept |
| `AuditLog` by the user as actor | unchanged — the actor is now a tombstone id |
| `ConsentRecord` | → `WITHDRAWN`, rows kept as evidence |
| `StockMovement.byUserId` | **no action** — bare string, no FK, staff-only. Known gap |
| Redis rate-limit keys | **no action** — ≤1h TTL, self-expiring |
| `localStorage` wishlist | on the customer's own device; never held by us |

## Failure recovery

**Cloudinary purge failed.** `/admin/privacy` → open the request → "Retry
deleting uploaded images" (`retryCloudinaryPurge`). If it keeps failing, check
`CLOUDINARY_API_SECRET`, then delete manually from the Cloudinary console — the
folder is `maa-furniture/custom-requests`.

**Transaction failed.** Nothing was written; the request stays `PENDING` and the
cron retries the following night. One failure does not abort the sweep.

**Cron never ran.** Symptom: `PENDING` erasures with a `scheduledFor` in the
past, visible in `/admin/privacy`. Usually `CRON_SECRET` is unset — the route
fails closed and returns 401. Set it in Vercel, then verify:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/privacy/execute-erasures
```

**Customer changed their mind.** Within the 7 days: `/admin/privacy` → "Cancel
deletion and restore account". This restores `isActive` but deliberately does
**not** roll back `tokenVersion` — sessions invalidated at request time stay
invalidated, so they sign in fresh rather than an old cookie springing back.
After the wipe there is nothing to restore.

## Erasing a staff account — manual

Self-service erasure refuses non-CUSTOMER roles. To erase a staff member:

1. Confirm they are not the last active OWNER (`isLastActiveOwner` in
   `src/actions/users.ts` enforces this on role change).
2. Reassign or accept orphaning of anything they created — `Product.createdById`
   and `Combo.createdById` are `Restrict` and **not** handled by
   `executeErasure`.
3. Demote them to `CUSTOMER` at `/admin/users`.
4. Run the erasure from `/admin/privacy` as OWNER.

Their `AuditLog` rows as *actor* are retained by design. A staff member being
able to erase the record of their own actions would defeat the point of the log.

## Safety limits

- `MAX_PER_RUN = 25` in the cron. A bug that scheduled thousands must not wipe
  them all in one pass.
- Erasures run **sequentially**, not in parallel — the Supabase pooler is capped
  at 2 connections (`src/lib/db.ts`) and a parallel sweep would exhaust it
  mid-wipe.
- `executeErasure` returns `already-erased` and does nothing if `erasedAt` is
  already set, so a re-run is harmless.
