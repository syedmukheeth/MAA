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
| Which users? | `AuditLog` (`entity`, `entityId`, `createdAt`); Supabase query logs; Vercel request logs |
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

## Preparation gap

There is **no automated breach detection**. No alerting on anomalous query
volume, no failed-login alerting, no uptime or error monitoring integration.
Discovery today depends on someone noticing.

The audit log gives good *forensics* after the fact; it does not give
*detection*. Adding error monitoring is the highest-value next step and is
recorded as a gap in
[10-dpdp-compliance-checklist.md](./10-dpdp-compliance-checklist.md).
