# DPDP compliance checklist

> **This is an engineering assessment, not a legal opinion.** It records what the
> code does against what the Act and Rules require. It does **not** state that
> MAA FURNITURE is legally compliant. Several rows need a qualified privacy or
> tax professional.

Statuses: `COMPLIANT` · `PARTIALLY COMPLIANT` · `NOT IMPLEMENTED` ·
`NOT APPLICABLE` · `REQUIRES LEGAL REVIEW`

## Commencement — what is actually in force

The DPDP Act 2023 was enacted in August 2023. The DPDP Rules 2025 have a
**phased commencement**: some provisions applied on notification, others on
staged dates thereafter.

This matters for reading the table below, and this document does **not** attempt
to fix the current commencement position — it changes, and a stale date in a
repository is worse than no date. **Confirm the current status against MeitY's
published notifications before relying on any row.**

Broadly:

- **Group 1 — treat as in force now.** Notice (§5), consent and withdrawal (§6),
  data principal rights (§11–14), security safeguards (§8(5)), breach
  notification (§8(6)), grievance redressal (§13). Everything in this
  implementation targets these.
- **Group 2 — phased.** Detailed Rules-2025 obligations including consent-manager
  registration and certain Significant Data Fiduciary duties.
- **Group 3 — good practice, not mandatory.** Click-to-load third-party embeds,
  masked emails in staff tooling, log minimisation. Done here because they are
  cheap and correct, not because a rule compels them.

---

## Notice and transparency

| Requirement | Implementation | Files | Status | Evidence |
|---|---|---|---|---|
| §5 — Notice at or before collection | Standalone `/privacy`; linked from register, login, checkout, custom studio, address form, footer | `src/app/(shop)/privacy/page.tsx` | COMPLIANT | Page renders publicly; `/privacy` in `PUBLIC_PREFIXES` |
| Rules 2025 — standalone, itemised, understandable | Its own route, plain language, `DataTable` inventory rather than prose | `src/components/legal/LegalPage.tsx` | COMPLIANT | Itemised table of category / purpose / basis / retention |
| §5 — Notice describes withdrawal, rights, complaints | Dedicated sections, linking `/account/privacy` and `/grievance` | `privacy/page.tsx` | COMPLIANT | — |
| §5(3) — Availability in Eighth Schedule languages | Notice states it is available in Telugu or Hindi on request. **No translation exists yet.** | — | PARTIALLY COMPLIANT | Manual fulfilment only |
| Notice versioning | `PRIVACY_NOTICE_VERSION` rendered on the page and copied into every consent record | `src/lib/privacy/constants.ts` | COMPLIANT | `ConsentRecord.noticeVersion` |
| Identity of the Data Fiduciary | Business name and showroom address on the notice | `privacy/page.tsx` | COMPLIANT | — |

## Consent

| Requirement | Implementation | Files | Status | Evidence |
|---|---|---|---|---|
| §6 — Free, specific, informed, unambiguous | One unticked box for marketing; separate consent for testimonials, not bundled into signup | `register/page.tsx`, `validations/auth.ts` | COMPLIANT | `defaultValues: { marketingConsent: false }` |
| §6 — No pre-ticked boxes, no bundling | Only consent-based processing has a box; contract-basis processing has a notice line, not a tick | `register/page.tsx` | COMPLIANT | [02](./02-lawful-basis.md) |
| §6(1) — Fiduciary can prove consent | Append-only `ConsentRecord` with timestamp, purpose, notice version, source | `prisma/schema.prisma` | COMPLIANT | No `@@unique` on (userId, purpose); `consent.test.ts` |
| §6(6) — Withdrawal as easy as giving | Single toggle, no dialog, no retention offer; unpublishes testimonials immediately | `ConsentToggles.tsx`, `setConsent()` | COMPLIANT | — |
| Withdrawal does not break essential function | Marketing and testimonials only; orders and account unaffected | — | COMPLIANT | [02](./02-lawful-basis.md) |
| Consent history visible to the principal | "Show consent history" on `/account/privacy` | `ConsentToggles.tsx` | COMPLIANT | — |
| Rules 2025 — Consent Manager registration | Not used; consent collected directly | — | NOT APPLICABLE | No consent manager in the architecture |

## Data principal rights

| Requirement | Implementation | Files | Status | Evidence |
|---|---|---|---|---|
| §11 — Access | JSON export, allow-list `select`, Blob download, rate-limited | `lib/privacy/export.ts` | COMPLIANT | `export.test.ts` asserts no credential keys |
| §12(1) — Correction | Self-service for name/password; ticketed for email and past orders | `actions/profile.ts`, `requestCorrection()` | COMPLIANT | — |
| §12(2) — Erasure | 7-day cooling-off, cron execution, anonymise-and-retain for invoices | `lib/privacy/erasure.ts` | COMPLIANT | [05](./05-erasure-runbook.md); `anonymise.test.ts` |
| §12(3) — Retention where required by law | Open orders block erasure; invoices anonymised not deleted | `OPEN_ORDER_STATUSES` guard | COMPLIANT | `ON_HOLD` path |
| §13 — Grievance redressal | `/account/privacy` and public `/grievance`; 30-day SLA; DPB escalation stated | `actions/privacy.ts` | COMPLIANT | — |
| §13 — Named grievance officer published | Syed Mukheeth, `maafurniture.shop@gmail.com`, phone from `SiteSettings.showroomPhone` | `constants.ts` | COMPLIANT | Rendered on `/privacy` and `/grievance`; `isGrievanceOfficerConfigured()` true |
| §14 — Right to nominate | Notice invites contact; handled manually | — | PARTIALLY COMPLIANT | Storing a nominee is more personal data for a rarely used right |
| Requests affect only the requester's own data | No privacy action accepts a user id; all scoped to `session.sub` | `actions/privacy.ts` | COMPLIANT | [04](./04-data-principal-rights.md) |

## Data minimisation and retention

| Requirement | Implementation | Files | Status | Evidence |
|---|---|---|---|---|
| §8(7) — Erase when purpose is served | Erasure pipeline; enquiries deleted when closed **on request only** | `erasure.ts` | PARTIALLY COMPLIANT | No automatic sweep — [03](./03-retention-schedule.md) |
| Collect only what is necessary | No DOB, gender, location, ID, card, or analytics identifiers. Custom-request phone flagged and justified | [01](./01-data-inventory.md) | COMPLIANT | Full inventory with necessity verdicts |
| Defined retention per category | Documented with statute and deletion mechanism | [03](./03-retention-schedule.md) | COMPLIANT | — |
| No indefinite retention | No `retain_forever` anywhere; every category has a period | — | PARTIALLY COMPLIANT | Periods defined; three categories lack an enforcing job |
| 8-year retention figure | Companies Act §128 vs CGST §36 give different end dates; longer applied | `ORDER_RETENTION_YEARS` | **REQUIRES LEGAL REVIEW** | [03](./03-retention-schedule.md) |
| Pincode erased from anonymised orders | Erased as a re-identifier | `anonymisedOrderFields()` | **REQUIRES LEGAL REVIEW** | One-line change if a tax adviser disagrees |

## Security (§8(5))

| Requirement | Implementation | Files | Status |
|---|---|---|---|
| Password hashing | bcrypt, 12 rounds | `auth/password.ts` | COMPLIANT |
| Session security | httpOnly + secure + sameSite cookie; `tokenVersion` revocation | `auth/jwt.ts` | COMPLIANT |
| Authorisation / RBAC | Three layers; escalation guards; no IDOR found | `roles.ts`, `session.ts` | COMPLIANT |
| Encryption in transit | HTTPS + HSTS; TLS to Postgres | `next.config.ts`, `db.ts` | COMPLIANT |
| Encryption at rest | Supabase platform default | — | PARTIALLY COMPLIANT — not independently verified |
| Rate limiting | Per-purpose limiters, fail-closed fallback | `redis.ts`, `rate-limit.ts` | COMPLIANT |
| Input validation | Zod schemas shared client/server | `lib/validations/**` | COMPLIANT |
| File-upload security | Signed uploads with format and size **inside** the signature | `cloudinary.ts` | COMPLIANT |
| Secrets management | Server-only; no secret behind `NEXT_PUBLIC_`; `.env` gitignored | `.env.example` | COMPLIANT |
| No personal data in logs | Audit summaries, order errors, email logs and dev scripts all scrubbed | [07](./07-security-controls.md) | COMPLIANT |
| No personal data in API responses | `/admin/users` leak fixed with explicit `select` | `admin/users/page.tsx` | COMPLIANT |
| Breach detection | `SecurityEvent` + detectors for stuffing, spraying, takeover, escalation, cron abuse; throttled email alerts on HIGH/CRITICAL; OWNER-only `/admin/security` | `src/lib/security/**` | COMPLIANT — for security events. Application health is still unmonitored |

## Breach notification (§8(6))

| Requirement | Implementation | Status |
|---|---|---|
| Ability to identify affected data and users | `AuditLog` + `SecurityEvent` (incl. `ipHash` correlation) + provider logs | COMPLIANT |
| Notification process | Runbook with templates and contact tree | COMPLIANT — [08](./08-breach-response.md) |
| Board notification | Documented; never exercised | PARTIALLY COMPLIANT |
| Detection capability | Ten detectors, throttled alerting to the DPO, OWNER-only dashboard | COMPLIANT for security events |
| Application health monitoring | Error capture with PII scrubbing, grouped by fingerprint; three-state `/api/health`; cron heartbeat; `/admin/monitoring` | PARTIALLY COMPLIANT — **no external uptime check configured**, so a total outage is still noticed by a customer first. See [11](./11-monitoring.md) |

## Children's data (§9)

| Requirement | Implementation | Status |
|---|---|---|
| Age verification / parental consent | None. Notice states the site is for adults and not directed at children | **REQUIRES LEGAL REVIEW** |
| No tracking or targeted advertising to children | No tracking or advertising to **anyone** | COMPLIANT |
| No behavioural profiling | None anywhere in the application | COMPLIANT |

A furniture retailer is not a service children use, and adding an age field
would mean collecting *more* personal data from everyone to satisfy a
requirement aimed elsewhere. **A fake age gate would be worse than none** — it
would claim a control that does not exist. The "not directed at children"
position needs confirming.

## Significant Data Fiduciary (§10)

| Requirement | Status |
|---|---|
| DPIA, annual audit, India-based DPO | **REQUIRES LEGAL REVIEW** — almost certainly out of scope at this scale, but the conclusion must be recorded rather than assumed |

## Rules 2025 — Rule 8 inactivity erasure

| Requirement | Status |
|---|---|
| Erase after 3 years' inactivity, 48h notice | **REQUIRES LEGAL REVIEW** — applies to classes defined by user-count thresholds this business is unlikely to meet. If in scope, it is a new feature |

---

## Must be done before launch

1. ~~Name the Data Protection Officer~~ — **done**, Syed Mukheeth.
2. **Set `CRON_SECRET`** in Vercel, or scheduled erasures never run. **Still
   outstanding.** Redeploy after adding it — env vars only apply to new
   deployments.
3. ~~Apply the three migrations~~ — **done** 2026-08-14, `prisma migrate status`
   reports the schema up to date.
4. **Confirm the Resend and Upstash regions** and update
   [09](./09-third-party-processing.md). Vercel (`icn1`) and Supabase
   (`ap-northeast-2`) are confirmed Seoul.
5. **Start the testimonial consent drive** — the homepage trust block is empty
   until it is done ([06](./06-consent-and-testimonials.md)).

## Recommended next

1. **Configure an external uptime check** against `/api/health`, alerting on a
   503 or a body containing `degraded`. Free tiers suffice. This is the one
   piece of monitoring that cannot live inside the deployment — if the site is
   down, so is the code that would report it. See [11](./11-monitoring.md).
2. A retention sweep for closed enquiries, aged-out orders and old audit rows.
   `SecurityEvent` and `ErrorEvent` are already swept by the nightly cron —
   extend that same job.
3. Remove `email` from the JWT payload, with a back-compat release.
4. Telugu and Hindi translations of the notice.
5. Data processing agreements with all five processors.
