# Breach response

## The obligation

DPDP §8(6) requires a data fiduciary to notify **the Data Protection Board of
India and each affected data principal** in the event of a personal data breach.

Two things make this stricter than people expect:

- **There is no materiality threshold.** Unlike GDPR, there is no "unlikely to
  result in a risk" exemption. A breach is a breach.
- **There is no grace period written into the Act.** Notification is expected
  without delay.

Do not spend the first day deciding whether it counts.

## What counts as a breach

Any unauthorised processing, disclosure, acquisition, sharing, use, alteration,
destruction or loss of access to personal data. In practice, for this
application:

- Database credentials or `JWT_SECRET` exposed (committed, leaked, screenshotted)
- Supabase project opened to public access, or an RLS regression
- A staff account compromised
- A code defect exposing one customer's data to another
- Cloudinary credentials leaked (customer-uploaded photos of their homes)
- Resend or Upstash credentials leaked
- A laptop with `.env` or `staff-credentials.local.txt` lost
- An export or admin page serving more data than it should

## Immediate actions — first hour

1. **Contain.** Rotate the affected credential. If unsure which, rotate all:
   `JWT_SECRET` (this signs out every user — acceptable), `DATABASE_URL`,
   `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`,
   `CRON_SECRET`.
2. **Lock compromised accounts** — `/admin/users` → suspend. This bumps
   `tokenVersion` and invalidates their sessions immediately.
3. **Do not delete evidence.** Do not clear logs, drop tables or force-push. The
   audit log and Vercel logs are how you answer "who was affected".
4. **Write down the time you found out.** Everything downstream is dated from it.

## Establishing scope

| Question | Where to look |
|---|---|
| What data was affected? | [01-data-inventory.md](./01-data-inventory.md) — map the compromised component to fields |
| When was it first noticed? | `/admin/security` — the timeline, including events that were detected but throttled from alerting |
| Which users? | `AuditLog` (`entity`, `entityId`, `createdAt`); `SecurityEvent.userId`; Supabase query logs; Vercel request logs |
| Same source across accounts? | `SecurityEvent.ipHash` — correlates one origin without holding anyone's IP |
| When did it start? | Vercel deployment history; Supabase logs; `git log` |
| What systems? | [09-third-party-processing.md](./09-third-party-processing.md) |
| Was it read or only exposed? | Access logs in the relevant provider's console |

Retention limits work against you here: Vercel and Upstash log retention are
short. Pull what you need on day one.

## Notifying the Board

Notify the Data Protection Board of India through its published channel. Include:

- Nature and extent of the breach, and the categories of personal data involved
- Approximate number of affected data principals
- When it occurred and when it was discovered
- Likely consequences
- Mitigation taken and planned
- Contact details of the Data Protection Officer
  (`GRIEVANCE_OFFICER` in `src/lib/privacy/constants.ts`)

## Notifying affected principals

Every affected person, individually. Get the addresses with:

```sql
SELECT id, email FROM "User"
WHERE id = ANY($1::text[]) AND "erasedAt" IS NULL;
```

Template — plain language, no euphemism:

> **Subject:** Important: a security incident affecting your MAA FURNITURE account
>
> On [date] we discovered that [what happened, in one sentence].
>
> The information affected was: [exact list — name, email, delivery address,
> phone number]. Your password was **not** exposed — we only ever store a
> scrambled one-way version of it. [Adjust if untrue.]
>
> What we have done: [containment].
>
> What you should do: [change your password / watch for calls claiming to be
> from us / nothing].
>
> If you have questions, contact [officer name] at [email] or [phone]. You may
> also complain to the Data Protection Board of India.

Do not send this through a channel that is itself compromised. If Resend is the
affected service, use another route.

## Afterwards

Within a week, write up: what happened, the timeline, root cause, who was
notified and when, and what changed so it cannot recur. Keep it in this
directory. Fix the root cause before closing.

## Contacts

| Role | Who |
|---|---|
| Data Protection Officer | `GRIEVANCE_OFFICER` — **must be a named person before launch** |
| Database | Supabase dashboard |
| Hosting | Vercel dashboard |
| Images | Cloudinary console |
| Email | Resend dashboard |
| Rate limiting | Upstash console |

## Detection

Detection is built in, using the existing database, Redis and email — no
external monitoring service, so no additional processor and no new cross-border
disclosure.

**Table:** `SecurityEvent` · **Code:** `src/lib/security/` · **Dashboard:**
`/admin/security` (OWNER only) · **Alerts:** email to the DPO.

| Detected | Type | Severity | Alerts? |
|---|---|---|---|
| Failed sign-in | `LOGIN_FAILED` | INFO | No — the aggregate is the signal |
| ≥6 failures on one account in 15 min | `CREDENTIAL_STUFFING_SUSPECTED` | HIGH | Yes |
| One source failing ≥5 *different* accounts in 30 min | `PASSWORD_SPRAYING_SUSPECTED` | HIGH | Yes |
| Success after ≥5 failures in 30 min | `LOGIN_SUCCESS_AFTER_FAILURES` | **CRITICAL** | Yes |
| Role raised | `PRIVILEGE_ESCALATION` | HIGH | Yes |
| Staff account suspended/reactivated | `STAFF_ACCESS_CHANGED` | MEDIUM | No |
| Signed-in user hitting a forbidden page | `UNAUTHORISED_ACCESS_ATTEMPT` | LOW | No |
| Erasure cron called without a valid token | `CRON_AUTH_FAILED` | HIGH | Yes |
| ≥3 full data exports by one account in 24h | `BULK_DATA_EXPORT` | MEDIUM | No |
| Erasure completed | `ERASURE_EXECUTED` | INFO | No |

Stuffing and spraying are separated deliberately: ten attempts against one
account and one attempt against ten accounts need different responses, and the
per-account rate limiter never sees the second.

### The log is not itself a liability

`SecurityEvent` stores a **keyed HMAC of the client IP**, never the address, and
a **user id**, never an email. The key is derived from `JWT_SECRET`; if that is
unset, `hashIp` returns null rather than falling back to an unkeyed digest —
the IPv4 space is small enough to enumerate, so a bare hash of an IP is
reversible in seconds and would still be personal data. Asserted in
`src/lib/security/events.test.ts`.

Retention is **730 days**, swept by the nightly cron
(`src/lib/security/retention.ts`).

### Alerting

Alerts fire on HIGH and CRITICAL only, to `GRIEVANCE_OFFICER.email`.

Throttled per event type — 1 hour, or 15 minutes for CRITICAL — claimed with a
Redis `SET NX EX` so two concurrent invocations cannot both send. The throttle
**fails open**: if Redis is unreachable we would rather send a duplicate than
drop the alert telling you the database is being drained. This is deliberately
the opposite of the rate limiters, where failing closed is correct.

**Alert emails contain no personal data** — no address, no IP, no name. They
state what happened, how many times, and link to `/admin/security`. An alert is
an unencrypted message to a mailbox; one that leaks the data it is warning about
is its own incident.

The dashboard distinguishes *alerted* from *throttled*, so a quiet inbox is
never mistaken for a quiet system.

### Remaining gaps

- **No uptime or error monitoring.** An unhandled exception or an outage still
  goes unnoticed unless someone looks. This covers *security* events, not
  application health.
- **No anomalous-query-volume detection.** A slow scrape staying under every
  threshold would not trip anything.
- **Nothing watches Supabase, Cloudinary, Resend or Upstash directly.** A
  compromise of a provider console would not surface here.
