# Consent management and the testimonial backlog

## How consent is stored

`ConsentRecord` is **append-only**. Granting inserts a `GRANTED` row; withdrawing
inserts a `WITHDRAWN` row. Nothing is ever updated in place, and there is
deliberately **no** `@@unique([userId, purpose])`.

The reason is DPDP §6(1): the burden of proving consent sits with the data
fiduciary. A single mutable row per purpose can tell you the current state but
destroys the history — you could not show *when* consent was given, under which
version of the notice, or that a withdrawal was honoured promptly.

Current state = the newest row per `(userId, purpose)`, resolved by
`resolveCurrentConsents()` in `src/lib/privacy/consent.ts`. Absence of any row
means **no consent** and never defaults to granted.

Each row records `noticeVersion` — a copy of `PRIVACY_NOTICE_VERSION` at the
moment of consent — so you can always say which text the person actually saw.
This is why that constant must be bumped whenever the notice changes
substantively, and never reused for different text.

## Where consent is captured

| Purpose | Where | Source recorded |
|---|---|---|
| `MARKETING_EMAIL` | Unticked box on `/register` | `REGISTRATION` |
| `MARKETING_EMAIL` | Toggle on `/account/privacy` | `ACCOUNT_PRIVACY_PAGE` |
| `TESTIMONIAL_PUBLICATION` | Toggle on `/account/privacy` | `ACCOUNT_PRIVACY_PAGE` |
| `TESTIMONIAL_PUBLICATION` | Staff attestation in the admin testimonial form | `STAFF_RECORDED` |

---

## The testimonial backlog

### The problem

Before this work, `Testimonial` rows were entered by staff and published on the
homepage carrying a **real person's name, city and photograph**, with no record
that the person had agreed. Publication is not contract performance and no law
requires it, so consent is the only available lawful basis — and there was none.

The rows were also unlinkable: `name` is free text with no foreign key, so an
erasure request could not find the published testimonial about that person.

### What was done

1. `Testimonial` gained `subjectUserId` (FK, `onDelete: SetNull`) and
   `consentRecordId`. Both nullable so existing rows and the existing form keep
   working.
2. `resolvePublishConsent()` in `src/actions/testimonials.ts` gates the
   transition to `isPublished = true`. Two routes to a yes: the customer granted
   it themselves, or a staff member attests they agreed offline — which writes a
   real `ConsentRecord` with `source: STAFF_RECORDED`, attributable to that staff
   member in the audit log.
3. `toggleTestimonialPublished` is gated identically. It is the quickest route to
   publication, so leaving it open would have made the form's check decorative.
4. **Migration `20260814000002_unpublish_testimonials_pending_consent` set
   `isPublished = false` on every existing row.**
5. Withdrawal at `/account/privacy` unpublishes linked testimonials in the same
   action — a takedown that waits for staff is not a takedown.
6. `location` capped at 40 characters, with the form asking for a city. "Sai
   Nagar, Kurnool" beside a name and photograph narrows a stranger to a few
   hundred households; "Kurnool" does not.

### Expected side effect

**The homepage testimonial section is empty until consent is collected.** That is
intended, and it is what the model's own doc-comment argues for: the section
renders nothing when there are no published rows, because an empty trust block is
honest and an unconsented one creates the problem it was meant to solve.

### Clearing the backlog

List what needs chasing:

```sql
SELECT id, name, location, "createdAt"
FROM "Testimonial"
WHERE "isPublished" = false
  AND "subjectUserId" IS NULL
ORDER BY "createdAt" DESC;
```

Match a testimonial to an account by name:

```sql
SELECT t.id AS testimonial_id, t.name, u.id AS user_id, u.email
FROM "Testimonial" t
JOIN "User" u ON lower(u.name) = lower(t.name)
WHERE t."subjectUserId" IS NULL AND u.role = 'CUSTOMER';
```

For each one:

1. Contact the customer — WhatsApp or phone is fine, this is how the business
   already talks to them.
2. Ask plainly: *may we show your review, your first name, your city and your
   photo on our website? You can ask us to take it down at any time.*
3. If yes: `/admin/testimonials` → edit → select their account in **Customer
   account** → tick the attestation → tick **Publish**. That writes a
   `ConsentRecord` under your name.
4. If no, or no reply: leave it unpublished. Do not publish and wait to be asked
   to stop.

### Walk-in customers with no account

There is no way to record consent for someone who cannot be linked to an
account, because there is no way for them to withdraw it later. Options:

- Ask them to create an account (they are a customer; they probably want one).
- Publish the quote **without** the name, city or photo — an anonymous quote is
  not personal data. This needs a small form change and is not built today.
- Leave it unpublished.

**REQUIRES LEGAL REVIEW** — whether a signed paper consent form in the showroom
is sufficient for a customer with no account, and how withdrawal would then be
honoured in practice.
