# Security controls

DPDP §8(5) requires reasonable security safeguards. This records what exists,
what changed in this work, and what risks are knowingly accepted.

## Authentication

- **Passwords:** bcrypt, 12 rounds (`src/lib/auth/password.ts`). Never stored or
  logged in readable form, and not included in the data export.
- **Sessions:** stateless HS256 JWT in the `maa_session` cookie —
  `httpOnly: true`, `secure` in production, `sameSite: "lax"`, 7-day expiry
  (`src/lib/auth/jwt.ts`, `src/actions/auth.ts`). Not readable by scripts.
- **`JWT_SECRET`** must be ≥32 characters; the app refuses to start otherwise.
- **Revocation:** `User.tokenVersion` is incremented on password change, role
  change and erasure. `getActiveUser()` re-reads the row on every server render
  and rejects any token behind the current version — so a suspension, a password
  reset or a deletion takes effect on the next request, not at token expiry.
- **Password reset:** CSPRNG token (`randomBytes(32)`), only its SHA-256 stored
  in Redis, 1-hour TTL, deleted on use, `tokenVersion` bumped on success.

## Authorisation

Three layers:

1. **Edge proxy** (`src/proxy.ts`) — signature-only JWT check. Routes `/admin`
   away from CUSTOMER, `/account` away from staff, unauthenticated users to
   `/login`.
2. **Layout guard** — `src/app/(admin)/admin/layout.tsx` and
   `src/app/(account)/account/layout.tsx` call `getActiveUser()`, which hits the
   database. This is where suspensions and erasures actually bite.
3. **Per-action** — `requireRole()` / `requireAuth()` in every server action.

Role sets in `src/lib/auth/roles.ts`. Privilege-escalation guards (rank table,
no self-role-change, last-owner protection) in `src/actions/users.ts`.

**No IDOR found.** Every action taking an id checks ownership
(`src/actions/addresses.ts`, `cancelOwnOrder`) or is staff-gated. The privacy
actions go further and accept **no** id at all — they derive the user from the
session, so there is nothing to tamper with.

## Rate limiting

Upstash sliding windows (`src/lib/redis.ts`), with an in-memory fallback so an
Upstash outage cannot fail open into unbounded brute force
(`src/lib/rate-limit.ts`).

Login 5/min per email + 30/5min per IP · register 10/h · forgot-password 3/h ·
reset 5/15min · uploads 20/h · custom requests 5/h · **data export 3/day ·
privacy requests 5/day · grievances 3/day**.

## Transport and headers

`next.config.ts`: HSTS (2 years, preload), `X-Frame-Options: DENY`,
`frame-ancestors 'none'`, `nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`.

Database connections use TLS (`src/lib/db.ts`).

## Database

Row Level Security is `ENABLE`d with no policies on every public table
(`20260722000000_enable_rls_all_tables`, extended to the new tables by
`20260814000001_enable_rls_privacy_tables`). The app connects as a `BYPASSRLS`
role over the pooler, so this is not the app's access control — it closes the
"anyone with the project URL and anon key can read everything" hole through
PostgREST. **New tables do not inherit RLS**, so any future migration adding a
table must enable it too.

## File uploads

Cloudinary signed uploads (`src/lib/cloudinary.ts`). `allowed_formats` and
`max_file_size` are **inside the signature** — Cloudinary only enforces signed
parameters, so leaving them out of the signature would let a caller omit the
constraint and upload anything. Signatures require an authenticated session and
are rate-limited.

## Fixed in this work

| Issue | Fix |
|---|---|
| **`/admin/users` leaked `passwordHash` and `tokenVersion` for up to 200 accounts into the browser RSC payload** — `findMany()` with no `select`, and the narrow client-side type was never a defence | Explicit allow-list `select` (`src/app/(admin)/admin/users/page.tsx`) |
| Audit `summary` and `metadata` embedded target users' email addresses | Now use the user id, which `entityId` already holds (`src/actions/users.ts`) |
| `placeOrder` logged the raw error — a Prisma error interpolates the failing query's parameters, i.e. the customer's name, phone and address | Logs error *name* plus `session.sub` only (`src/actions/orders.ts`) |
| Email logging printed subject lines (order numbers, customer names) and the raw Resend error, which echoes the recipient address | Logs sender and error name only (`src/lib/email.ts`) |
| Audit-failure log printed `actorId` | Removed (`src/lib/audit.ts`) |
| `db:users` script printed every customer's email and name | Masked by default, `--full` to override (`prisma/scripts/list-users.ts`) |
| `db:staff` script printed cleartext staff passwords to stdout, where they persist in shell history, CI logs and screenshots | Written to a gitignored `staff-credentials.local.txt` with mode `0600` (`prisma/scripts/upsert-staff.ts`) |
| Google Maps iframe contacted Google and set its cookies on every `/showroom` render | Click-to-load, with a plain directions link that loads nothing |
| Contact form reported "Message sent" and discarded every enquiry | Removed; replaced with WhatsApp / phone / email and a `/grievance` link |

## Accepted risks

**Proxy verifies the JWT signature only, not the database.** A suspended or
erased user's existing 7-day cookie passes the edge check and is stopped one
layer later by `getActiveUser()` in the layout. Accepted: adding a database
round-trip to every request is a real cost, and the layout guard covers the
whole `/account` and `/admin` subtrees. Verified that both layouts call it.

**The session JWT contains the user's email.** Minimising it to `sub` alone is
correct and was deliberately deferred — it touches `SessionPayload`,
`signSession`, `verifySession`, `createSessionCookie` and the auth tests, and
needs a back-compat release so existing cookies keep validating. Tracked as an
open item. The cookie is `httpOnly` and `secure`, so the exposure is limited to
somewhere a full cookie is captured.

**`StockMovement.byUserId` is a bare string with no FK** and survives erasure as
an orphaned identifier. Staff-only, never a customer.

**No automatic retention sweep** for closed enquiries, aged-out orders or old
audit rows — see [03-retention-schedule.md](./03-retention-schedule.md).

**Rate-limit keys embed the login email** in Redis for up to an hour. Necessary
for per-account limiting; short-lived and self-expiring.

## Secrets

All secrets are server-only. The only two `NEXT_PUBLIC_` variables are
`NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` (publishable by
design; the secret is the server-only `RAZORPAY_KEY_SECRET`). `.env` is
gitignored; only `.env.example` is tracked, and it contains no values.

`CRON_SECRET` is compared with `timingSafeEqual` and the route **fails closed**
when it is unset — an unset secret means "nobody may call this", never "anybody".
