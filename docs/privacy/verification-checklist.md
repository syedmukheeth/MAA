# Verification checklist

Manual test script for the privacy features. **Not** an automated test — several
steps mutate and destroy data irreversibly.

**Run this against a staging database or a local copy, never production.**

## Automated first

```bash
npm test
npm run lint
npm run build
```

All three must pass. The build is not optional here: the client/server module
boundary is what stops a database import ending up in the browser bundle, and
that failure only surfaces at build time (it did once during this work —
`ConsentToggles` importing labels from a module that imports `prisma`).

## Applying the migrations

Three migrations, in order:

```bash
npx prisma migrate deploy
```

Run with `DIRECT_URL` set to the **session-mode** connection (port 5432). The
transaction pooler on 6543 cannot run DDL.

| Migration | What it does |
|---|---|
| `20260814000000_add_dpdp_consent_and_privacy_requests` | Adds enums, `ConsentRecord`, `PrivacyRequest`, `User.erasedAt`, `Testimonial.subjectUserId` |
| `20260814000001_enable_rls_privacy_tables` | Enables RLS on the two new tables |
| `20260814000002_unpublish_testimonials_pending_consent` | **Unpublishes every existing testimonial** |

Expect the homepage testimonial section to be empty afterwards. That is intended
— see [06-consent-and-testimonials.md](./06-consent-and-testimonials.md).

---

## 1. Public pages are actually public

**The single most likely regression.** `src/proxy.ts` matches everything not in
its exclusion list; a legal page missing from `PUBLIC_PREFIXES` 307s to `/login`.

In a private window, signed out:

- [ ] `/privacy` loads — no redirect
- [ ] `/terms` loads — no redirect
- [ ] `/grievance` loads and the form is usable — no redirect
- [ ] Footer shows Privacy Notice, Terms, Grievance Redressal on every page
- [ ] `/sitemap.xml` lists all three

## 2. Consent at registration

- [ ] The marketing box is **unticked** on load
- [ ] The Terms / Privacy line under the button is text, **not** a checkbox, and
      both links work
- [ ] Register **without** ticking → `SELECT count(*) FROM "ConsentRecord" WHERE
      "userId" = ...` returns **0**. Absence is how "no consent" is stored — a
      `WITHDRAWN` row here is a bug
- [ ] Register **with** it ticked → exactly one row, `GRANTED`,
      `source = REGISTRATION`, `noticeVersion` matching the notice page

## 3. Consent toggling

At `/account/privacy`:

- [ ] Toggling reflects instantly, no confirmation dialog, no retention offer
- [ ] Toggle on then off → **two new rows**, not one updated row
- [ ] "Show consent history" lists them newest first with the notice version
- [ ] After withdrawing marketing, reload — it stays off

## 4. Data export

- [ ] Downloads a `.json` file
- [ ] `grep -c passwordHash` → **0**
- [ ] `grep -c tokenVersion` → **0**
- [ ] Contains your account, addresses, orders with items, consent history
- [ ] Fourth download in 24h is rate-limited

## 5. Correction and grievance

- [ ] Correction form creates a `CORRECTION` `PrivacyRequest`, visible under
      "Your requests"
- [ ] The page links to `/account` for name changes rather than duplicating them
- [ ] Grievance creates a `GRIEVANCE` request, emails the officer, and
      acknowledges to the customer
- [ ] Public `/grievance` with an email that has **no** account → row with
      `contactEmail` set and `userId` null
- [ ] Public `/grievance` with an email that **has** an account → row attached to
      that `userId`, `contactEmail` null (the address is not stored twice)

## 6. Erasure — blocked path

- [ ] Place an order, leave it `PENDING`
- [ ] Request deletion → message says it is on hold
- [ ] `PrivacyRequest.status = 'ON_HOLD'`
- [ ] **The account still works** — you are not locked out for an order we still
      have to deliver

## 7. Erasure — wrong password and wrong phrase

- [ ] Wrong password → "That password is not correct", no request created
- [ ] `delete my data` (lower case) → rejected
- [ ] `DELETE MY DATA ` (trailing space) → rejected

## 8. Erasure — full path

Record the user id and email first.

- [ ] Mark the order `DELIVERED`, then request deletion
- [ ] `PrivacyRequest{ ERASURE, PENDING }` with `scheduledFor` ≈ +7 days
- [ ] **Session cleared** — you are signed out immediately
- [ ] Signing in with the old password fails (`isActive = false`)
- [ ] Confirmation email received

Then run the cron:

```bash
curl -i https://<host>/api/privacy/execute-erasures
# expect 401

curl -i -H "Authorization: Bearer $CRON_SECRET" \
  https://<host>/api/privacy/execute-erasures
# expect 200 {"due":1,"erased":1,...}
```

Verify by SQL:

```sql
SELECT name, email, "passwordHash", "isActive", "erasedAt"
FROM "User" WHERE id = '<id>';
-- 'Deleted user', erased-<id>@erased.invalid, '!erased', false, <timestamp>

SELECT "shippingName", "shippingPhone", "shippingLine1", "shippingPincode",
       "shippingCity", "shippingState", total, "orderNumber"
FROM "Order" WHERE "userId" = '<id>';
-- name/phone/line1 = '[erased]', pincode = '000000'
-- city, state, total, orderNumber ALL INTACT   <- the important assertion

SELECT count(*) FROM "Address" WHERE "userId" = '<id>';        -- 0
SELECT count(*) FROM "Cart"    WHERE "userId" = '<id>';        -- 0
SELECT status, "withdrawnAt" FROM "ConsentRecord" WHERE "userId" = '<id>';
-- rows PRESENT, all WITHDRAWN

SELECT summary, metadata FROM "AuditLog"
WHERE entity = 'User' AND "entityId" = '<id>';
-- summary '[erased]', no targetEmail key
```

- [ ] Any Cloudinary URL from a custom enquiry now 404s
- [ ] Deletion confirmation email received at the **original** address
- [ ] Re-registering with the same email **succeeds** — the unique index was
      freed by the tombstone

## 9. Post-erasure regressions

**The most likely place something breaks.** The admin now renders orders whose
`shippingName` is `[erased]`.

- [ ] `/admin/orders` lists the anonymised order without crashing
- [ ] `/admin/orders/[id]` opens it
- [ ] `/admin/users` shows the tombstoned account
- [ ] Analytics pages still load

If any crash, grep the admin order components for `.split()`, `charAt`, `[0]` or
initials logic applied to `shippingName`.

## 10. Admin queue authorisation

- [ ] As MANAGER: no "Privacy Requests" in the sidebar; `/admin/privacy` → `/403`
- [ ] As ADMIN: visible; emails shown masked (`ra***@gmail.com`)
- [ ] As ADMIN: no "Erase now" control
- [ ] As OWNER: "Erase now" present, disabled until `ERASE NOW` is typed
- [ ] Setting an ERASURE request to `COMPLETED` by hand is **refused** — it would
      record a deletion that never happened
- [ ] Cancelling a pending erasure restores `isActive`

## 11. The /admin/users leak

- [ ] Open `/admin/users`, DevTools → Network → the document response
- [ ] Search the payload for `passwordHash` → **not present**
- [ ] Search for `tokenVersion` → **not present**

## 12. Testimonial consent gate

- [ ] Every pre-existing testimonial is unpublished; homepage section is empty
- [ ] New testimonial with no customer linked → Publish is **disabled**
- [ ] Link a customer with no consent → still disabled until the attestation is
      ticked
- [ ] Tick the attestation and publish → a `ConsentRecord` appears with
      `source = STAFF_RECORDED`
- [ ] That customer withdraws consent at `/account/privacy` → the testimonial
      disappears from the homepage **immediately**
- [ ] The list-view publish toggle is gated the same way

## 13. Log hygiene

Watch the server console while doing each:

- [ ] Place an order with a deliberately invalid variant → error line shows an
      error *name* and a user id, **no shipping name, phone or address**
- [ ] Trigger an email failure (bad `RESEND_API_KEY`) → no subject line, no
      recipient address, no raw error object
- [ ] Change a user's role → `AuditLog.summary` contains the user **id**, not an
      email; `metadata` has no `targetEmail`
- [ ] `npm run db:users` → emails masked; `-- --full` shows them

## 14. Showroom page

- [ ] The map does **not** load on page load — placeholder with a "Show map"
      button
- [ ] DevTools → Network, filter `google` → **no requests** before clicking
- [ ] Clicking "Show map" loads the iframe
- [ ] "Get directions" works without loading the embed
- [ ] The old contact form is gone; WhatsApp, phone and email links work
- [ ] The `/grievance` link is present

## 15. Full regression sweep

The privacy work touched registration, the footer, checkout and the admin. Walk
the core flow once:

- [ ] Register → browse → add to cart → checkout → order confirmation email
- [ ] Cancel an order from `/account/orders`
- [ ] Save, edit and delete an address
- [ ] Submit a custom furniture request with a photo
- [ ] Staff: change an order status, adjust inventory, edit site settings
- [ ] Password reset end to end
