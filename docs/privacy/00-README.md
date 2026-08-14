# Privacy & DPDP documentation

This directory documents how MAA FURNITURE actually handles personal data. It
describes the code as built, not an aspiration — every claim here should be
checkable against a file path given in the text.

## What this is not

This is an **engineering compliance assessment**. It is not legal advice and it
does not certify that the application is legally compliant with the Digital
Personal Data Protection Act, 2023 or the DPDP Rules, 2025. Several decisions
documented here depend on legal interpretation and are marked
**REQUIRES LEGAL REVIEW** — see [10-dpdp-compliance-checklist.md](./10-dpdp-compliance-checklist.md).

## Contents

| File | What it covers |
|---|---|
| [01-data-inventory.md](./01-data-inventory.md) | Every personal-data field, where it is collected, who sees it, how long it is kept |
| [02-lawful-basis.md](./02-lawful-basis.md) | Which processing runs on consent and which does not, with reasoning |
| [03-retention-schedule.md](./03-retention-schedule.md) | Retention periods, the statutes behind them, and the deletion mechanism |
| [04-data-principal-rights.md](./04-data-principal-rights.md) | Each right → the UI → the action → the SLA |
| [05-erasure-runbook.md](./05-erasure-runbook.md) | Exactly what an erasure does, in what order, and how to recover a partial failure |
| [06-consent-and-testimonials.md](./06-consent-and-testimonials.md) | The testimonial consent backlog and how to clear it |
| [07-security-controls.md](./07-security-controls.md) | Authentication, authorisation, logging, and accepted risks |
| [08-breach-response.md](./08-breach-response.md) | What to do when personal data is exposed |
| [09-third-party-processing.md](./09-third-party-processing.md) | Every processor, what it receives, and where it runs |
| [10-dpdp-compliance-checklist.md](./10-dpdp-compliance-checklist.md) | Requirement → implementation → status → evidence |
| [verification-checklist.md](./verification-checklist.md) | Manual test script for the privacy features |

## Before this goes live

1. ~~**Name the Data Protection Officer.**~~ Done — `GRIEVANCE_OFFICER.name` in
   `src/lib/privacy/constants.ts` is **Syed Mukheeth**, contactable at
   `maafurniture.shop@gmail.com` with the phone falling back to
   `SiteSettings.showroomPhone`. `isGrievanceOfficerConfigured()` now returns
   true, so the "Setup incomplete" banner no longer renders on `/privacy` and
   `/grievance`.
2. **Set `CRON_SECRET`** in the Vercel project. Without it the nightly erasure
   job refuses to run (fail-closed), which means scheduled deletions silently
   never happen — safe, but a broken promise. See `.env.example`.
   **Env vars only apply to new deployments — redeploy after adding it.**

## Updating the privacy notice

The notice lives at `src/app/(shop)/privacy/page.tsx`. Its version is the
constant `PRIVACY_NOTICE_VERSION` in `src/lib/privacy/constants.ts`, and every
`ConsentRecord` copies that string at the moment consent is given.

When you change anything substantial in the notice — a new data category, a new
purpose, a new processor, a changed retention period — you **must** bump both
`PRIVACY_NOTICE_VERSION` and `PRIVACY_NOTICE_EFFECTIVE_DATE`, and archive the
superseded text in this directory. Reusing a version number for different text
destroys the evidential value of every consent record pointing at it.

Cosmetic edits (typos, formatting) do not need a bump.
