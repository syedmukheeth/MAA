# Data principal rights

Every right below is served by working code. There are no placeholder buttons.

Customer entry point: **`/account/privacy`** (Account → Privacy tab).
Public entry point (no account needed): **`/grievance`**.

Response commitment: **30 days** (`GRIEVANCE_SLA_DAYS`).

---

## §11 — Right to access information

| | |
|---|---|
| **UI** | `/account/privacy` → "What we hold about you" and "Download your data" |
| **Action** | `exportMyData()` — `src/actions/privacy.ts` |
| **Builder** | `buildDataExport()` — `src/lib/privacy/export.ts` |
| **Output** | JSON: account, addresses, orders with items, custom enquiries, consent history, privacy requests, account-administration audit entries |
| **Rate limit** | 3 per 24h per user (`dataExportRatelimit`) |
| **Audited** | `privacy.export` |

The on-page summary shows **counts**, not contents — a page left open in a
browser tab should not be a full personal profile. The contents are in the
download.

Two design choices worth stating:

- Every query uses an **allow-list `select`**, never an exclude. A future column
  cannot ride along by accident. `export.test.ts` walks the output for
  `passwordHash` / `tokenVersion` and fails if either appears.
- The file is streamed to the browser as a Blob. **No file is written to disk
  and no signed URL is minted** — a URL would be a second, unauthenticated copy
  of everything the session just authorised, outliving the session itself.

`metadata` on audit entries is withheld: one staff action can touch two people,
and disclosing the other person's details would be a fresh breach.

## §12(1) — Right to correction and completion

| | |
|---|---|
| **Self-service** | Name and password at `/account` → `updateProfile()` (`src/actions/profile.ts`) |
| **Staff-mediated** | `requestCorrection()` → creates a `CORRECTION` `PrivacyRequest` |
| **Queue** | `/admin/privacy` |

Email and past-order shipping details are deliberately **not** self-service:
email is the login identifier and appears in issued JWTs, and order shipping is
part of a tax invoice. The UI says so rather than offering a form that silently
does nothing. `correctionRequestSchema` does not even list `name` as an option,
because that is already editable one page away.

## §12(2) — Right to erasure

| | |
|---|---|
| **UI** | `/account/privacy` → "Delete your account" |
| **Action** | `requestErasure()` → `src/actions/privacy.ts` |
| **Execution** | `executeErasure()` → `src/lib/privacy/erasure.ts` (not a server action) |
| **Trigger** | Nightly cron `/api/privacy/execute-erasures`, or OWNER override |
| **Rate limit** | 5 per 24h |
| **Audited** | `privacy.erasure_request`, `_blocked`, `_cancel`, `_complete` |

Guards, in order: current password required; CUSTOMER role only; open orders put
the request `ON_HOLD` (DPDP §12(3) — the contract is still live). On success the
account is **locked immediately** and the wipe runs after 7 days, so the data
stops being used at once while an accidental deletion stays recoverable.

Full detail: [05-erasure-runbook.md](./05-erasure-runbook.md).

## §6(6) — Right to withdraw consent

| | |
|---|---|
| **UI** | `/account/privacy` → "Optional permissions" |
| **Action** | `setConsent()` |
| **History** | Visible on the same page |

**One click, no confirmation dialog, no retention offer, no multi-step funnel.**
The Act requires withdrawal to be as easy as giving, and every "are you sure you
want to miss out?" interstitial is the thing that requirement forbids.

Withdrawing testimonial consent unpublishes the testimonial in the same action —
a takedown that waits for staff is not a takedown.

## §13 — Right of grievance redressal

| | |
|---|---|
| **Signed in** | `/account/privacy` → "Raise a complaint" → `submitGrievance()` |
| **Not signed in** | `/grievance` → `submitPublicGrievance()` |
| **Notified** | `GRIEVANCE_OFFICER.email` receives it; the principal gets an acknowledgement |
| **Queue** | `/admin/privacy`, with an SLA badge at 20 days |

The public route exists because the two people most likely to need it cannot
sign in: someone whose account we locked pending erasure and who wants to cancel,
and someone who never had an account but whose data we hold anyway.

The DPB escalation right is stated on both pages.

## §14 — Right to nominate

**NOT IMPLEMENTED IN CODE.** The privacy notice invites the principal to contact
us to arrange a nominee, which is handled manually.

Building this properly means storing a nominee's name and contact details —
another person's personal data, for a right very rarely exercised at this scale.
Handling it by correspondence is the more proportionate answer for now.

## Authorisation

Every action begins `const session = await requireAuth()` and scopes every query
by `session.sub`. **No action in `src/actions/privacy.ts` accepts a user id from
the caller.** That closes the IDOR surface by construction rather than by
remembering to check ownership in six places.

`executeErasure()` does take a user id — which is precisely why it lives in
`src/lib/privacy/erasure.ts` and not in a `"use server"` file. Every export from
a server-action module is a client-callable RPC endpoint; exporting it there
would publish "delete any account by id" to the internet. Its only callers are
the token-guarded cron route and the OWNER-gated admin action.
