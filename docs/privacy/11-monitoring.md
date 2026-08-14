# Uptime and error monitoring

Security detection ([08](./08-breach-response.md)) answers "is someone attacking
us". This answers "is the site working". They are different questions with
different failure modes, and this one has a limit worth stating up front.

---

## The thing self-hosted monitoring cannot do

**This application cannot tell you it is down.** If Vercel is down, or the build
is broken, or DNS is misconfigured, then the code that would report the problem
is the code that is not running. `/admin/monitoring` says so on the page itself.

Detecting a total outage requires something *outside* this deployment.

### Required: an external uptime check

Point any external checker at:

```
https://maafurniture.shop/api/health
```

Alert on **both**:

1. **HTTP 503** — the database is unreachable and the site cannot function.
2. **A response body containing `"degraded"`** — still serving traffic, but
   something needs attention.

Every free tier is sufficient: UptimeRobot, Better Stack, Cronitor, or a GitHub
Actions workflow on a schedule. This is configuration, not code, and it is the
one piece of monitoring that has to live somewhere else.

**No monitoring service has been signed up for**, deliberately — that is an
account decision, and every external monitor that receives request metadata is
a processor that would need adding to
[09-third-party-processing.md](./09-third-party-processing.md) and to the
privacy notice. A checker that only pings `/api/health` receives no personal
data, because the response deliberately contains none.

---

## Health endpoint

`src/app/api/health/route.ts`. Unauthenticated — an uptime monitor cannot hold a
credential — and the response carries no personal data, no counts, and no
version or dependency information.

Three states, not two. A binary up/down check only catches total outages, and
the failures that actually happen here are partial.

| Status | HTTP | Meaning |
|---|---|---|
| `ok` | 200 | Everything healthy |
| `degraded` | 200 | Serving traffic, something needs attention |
| `error` | 503 | Database unreachable |

```json
{
  "status": "degraded",
  "timestamp": "2026-08-14T03:00:00.000Z",
  "checks": {
    "database": "ok",
    "cache": "error",
    "scheduledJobs": "stale",
    "hoursSinceLastJobRun": 52
  }
}
```

Only the database produces a 503 — without it nothing works. Redis failing means
rate limiting has fallen back to the per-instance in-memory limiter, and a stale
heartbeat means scheduled erasures are not happening. Both are serious; neither
stops the shop, so neither should page someone as an outage.

## Cron heartbeat

`src/lib/monitoring/heartbeat.ts`.

A cron that silently stops is the worst failure mode in this application: no
error is thrown, nothing appears in any log, and the only symptom is that
erasures customers asked for never happen. That is a broken statutory promise
that looks exactly like normal operation.

The nightly job writes a timestamp to Redis on each successful completion.
`/api/health` reports `scheduledJobs` as:

- `ok` — ran within 36 hours
- `stale` — ran, but too long ago
- `never` — no record at all, usually an unset `CRON_SECRET`
- `unknown` — Redis unreachable, so we genuinely cannot tell

`never` and `unknown` are kept distinct on purpose: "the job has never run" and
"we cannot see whether it ran" call for different responses.

---

## Error tracking

`src/lib/monitoring/` · dashboard at `/admin/monitoring` (OWNER + ADMIN).

### Grouped, not logged

The unit is the **fingerprint**, not the occurrence. An error firing ten
thousand times is one row with a count of ten thousand. A per-occurrence table
becomes unreadable exactly when something is badly broken — the moment it most
needs to be readable.

The fingerprint is a hash of the error name, the **scrubbed** message and the
top stack frame. Scrubbing before hashing is what makes one bug affecting a
hundred customers group into one row instead of a hundred; otherwise the count,
the thing that tells you how bad it is, would always read 1.

### Capture points

| Source | Where |
|---|---|
| `SERVER` | `src/instrumentation.ts` → Next's `onRequestError`, covering server renders, server actions and route handlers |
| `CRON` | Same hook; errors under `/api/privacy/` are tagged separately because nobody is watching a screen when a job fails |
| `CLIENT` | `src/app/error.tsx` and `global-error.tsx` → `reportClientError` |

`redirect()` and `notFound()` are filtered out — Next signals both by throwing,
and capturing them would bury real errors under routine navigation.

Edge-runtime errors are **not** captured: the only edge code is `src/proxy.ts`,
and Prisma cannot run there.

### The scrubber is the important part

`src/lib/monitoring/scrub.ts`, tested in `scrub.test.ts`.

An unfiltered error store would quietly become one of the largest collections of
personal data in the system, because the errors most worth capturing are exactly
the ones carrying it:

- `PrismaClientKnownRequestError` interpolates the failing query's parameters
  into its message. For `placeOrder`, those are the customer's shipping name,
  phone number and street address.
- Zod errors quote the value that failed — usually an email or phone.
- Any future `throw new Error(\`... ${user.email}\`)`.

Redacted: emails, Indian mobile numbers, cuids, delivery-range pincodes, JWTs,
bearer tokens, bcrypt hashes, and Postgres connection strings. Routes are
stripped to the path, because query strings are where identifiers end up.
Messages are collapsed and capped at 500 characters; stacks keep six frames.

**This is redaction by pattern and therefore best-effort.** Error text is
unstructured and there is no schema to validate against, so it catches the
shapes that actually occur here and cannot promise to catch every possible leak.
It is defence in depth, paired with truncation and with never storing query
strings — not a guarantee.

### Alerting

To the DPO, throttled to one email per distinct error per hour, on:

- a **genuinely new** fingerprint
- a known error crossing every 50th occurrence

Fails open, like the security alerts: a duplicate beats silence about a site
that is broken for everyone.

### Triage

Marking an error resolved is a claim, not a deletion. `captureError` clears
`resolvedAt` automatically on recurrence, so "we thought this was fixed and it
is not" is visible — which is the most useful thing an error tracker can say.

Rows untouched for **90 days** are purged by the nightly job. Open errors are
never auto-purged.

### Abuse surface

`reportClientError` is unauthenticated and writes to the database, so it is
rate-limited to 20/hour per IP. Only the message and boundary digest are
accepted; caller-supplied stacks are not, since they would be arbitrary text
into a table staff read.

---

## Privacy position

`ErrorEvent` is designed not to hold personal data: messages, stacks and routes
are scrubbed at capture, and no user id, IP or session identifier is stored at
all — unlike `SecurityEvent`, which needs a keyed IP hash to correlate attacks.

Retention 90 days, in [03-retention-schedule.md](./03-retention-schedule.md).
No external processor, so no addition to
[09-third-party-processing.md](./09-third-party-processing.md) and no change to
the privacy notice — **unless** you sign up for an external uptime service, in
which case check what it receives before pointing it at anything but
`/api/health`.

## Remaining gaps

- **No external uptime check is configured yet.** Until one is, a total outage
  is still noticed by a customer first. This is the top item.
- **No anomalous-query-volume detection.** A slow scrape staying under every
  threshold trips nothing.
- **Nothing watches Supabase, Cloudinary, Resend or Upstash consoles directly.**
  A compromise of a provider account would not surface here.
- **No performance monitoring.** Slow is not the same as broken, and only broken
  is detected.
