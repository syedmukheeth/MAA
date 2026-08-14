# Lawful basis

Under the DPDP Act 2023, personal data may be processed on **consent** (§6) or
for a **legitimate use** (§7). These are alternatives, not a hierarchy.

## The central decision

**Almost nothing this application does runs on consent, and we have deliberately
not pretended otherwise.**

The tempting design is a wall of checkboxes at signup covering everything. It is
the wrong design and it is worse than no checkboxes at all:

- Consent under §6 must be *free*. A box you must tick to complete signup is not
  free — the standard example of invalid consent.
- Consent must be *withdrawable* as easily as it is given (§6(6)). If checkout
  ran on consent, withdrawing it would have to break checkout.
- Claiming consent as the basis when a legitimate use applies misstates the
  basis in the notice, which is itself a defect.

So the checkbox count is deliberately **one**.

## The mapping

| Processing | Basis | Section | Checkbox? |
|---|---|---|---|
| Account creation, login, password reset | Performance of the contract the account is | §7(a) | No |
| Cart, checkout, order placement | Performance of contract | §7(a) | No |
| Shipping snapshot on the order | Performance of contract | §7(a) | No |
| Order confirmation and status emails | Performance of contract | §7(a) | No |
| Retaining invoices for 8 years | Compliance with law (Companies Act, CGST) | §7(b) | No |
| Custom furniture enquiry | Steps towards a contract, at the principal's own request | §7(a) | No |
| Audit log of staff actions | Legitimate use — internal control and fraud prevention | §7 | No |
| IP addresses in rate limiters | Security of the service | §7 | No |
| **Marketing / offers email** | **Consent** | **§6** | **Yes, unticked** |
| **Publishing a named testimonial** | **Consent** | **§6** | **Yes, separately** |

## Why those two are consent

**Marketing email.** The customer gains nothing from it, no contract requires
it, and no law compels it. It exists because we want to sell more. That is the
textbook shape of consent-based processing. Implemented as one unticked box on
`/register` (`src/app/(auth)/register/page.tsx`), toggleable at
`/account/privacy`.

**Testimonial publication.** We publish a real person's name, city and
photograph on a public homepage. There is no contract to perform and no legal
obligation. Enforced in `resolvePublishConsent()`
(`src/actions/testimonials.ts`) on the transition to published — saving an
unpublished draft is always allowed.

Testimonial consent is **not** collected at registration. It is a decision about
one specific quote, made months later; bundling it into signup would be exactly
the bundled consent §6 rules out.

## How "no consent given" is represented

Absence of a `ConsentRecord` row. `registerAction` writes **nothing** when the
box is left unticked — not a `WITHDRAWN` row, because that would assert consent
was given and then revoked, which is false.

`isGranted()` (`src/lib/privacy/consent.ts`) therefore returns `false` for an
empty history and never defaults to granted. This is asserted in
`src/lib/privacy/consent.test.ts`.

## What withdrawal does and does not do

Withdrawing consent stops the consent-based processing and nothing else. It does
not cancel orders, close the account, or stop transactional email — none of
which ran on consent in the first place. `setConsent` in
`src/actions/privacy.ts` additionally unpublishes any linked testimonial
immediately, because a delayed takedown is not a takedown.

## The notice line that is not a checkbox

`/register` shows "By creating an account you agree to our Terms and Privacy
Notice." as plain text, not a tick box. Under DPDP §5 the notice must be
*available* at the point of collection; it does not require an acknowledgement,
and a mandatory tick would misrepresent contract-basis processing as consent.

---

**REQUIRES LEGAL REVIEW** — whether the custom furniture enquiry is best
characterised as pre-contractual steps (as here) or as consent. The practical
difference is small: either way the data is deleted when the enquiry closes.
