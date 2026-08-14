# Third-party data processing

Every external service that receives personal data, what it receives, and where
it runs.

---

## Supabase (PostgreSQL)

| | |
|---|---|
| **Purpose** | The application database |
| **Data sent** | Everything — accounts, addresses, orders, enquiries, consent records |
| **Personal data** | Yes, all of it |
| **Stores it** | Yes, this is the store of record |
| **Region** | **`ap-northeast-2` — Seoul, South Korea** (confirmed from the connection host `aws-1-ap-northeast-2.pooler.supabase.com`) |
| **Code** | `src/lib/db.ts` |
| **Notes** | TLS in transit; encryption at rest is Supabase's platform default. RLS enabled with no policies on all tables as a PostgREST lockout |

## Vercel

| | |
|---|---|
| **Purpose** | Hosting and serverless execution |
| **Data sent** | Every request — IP address, user agent, URL, and any personal data in a request body passes through |
| **Personal data** | Yes, transiently; plus whatever reaches the log store |
| **Stores it** | Request and function logs, per Vercel's retention |
| **Region** | **`icn1` — Seoul, South Korea** (`vercel.json`) |
| **Notes** | This is the cross-border transfer disclosed in the privacy notice |

Log hygiene was tightened specifically because of this: the fixes listed in
[07-security-controls.md](./07-security-controls.md) exist so that personal data
does not accumulate in a log store outside India with a retention policy we do
not control.

## Resend

| | |
|---|---|
| **Purpose** | Transactional email |
| **Data sent** | Recipient email address, and the message body — customer name, order number, item names, totals, order status, password-reset links; custom-request notifications to staff include the requester's name and phone |
| **Personal data** | Yes |
| **Stores it** | Delivery logs, per Resend's retention |
| **Region** | Resend's infrastructure — **VERIFY**, primarily US |
| **Code** | `src/lib/email.ts`, `src/lib/email-templates.ts` |

## Cloudinary

| | |
|---|---|
| **Purpose** | Image storage and CDN delivery |
| **Data sent** | Product images (not personal); **customer-uploaded photos** from custom enquiries and testimonials, which may show the inside of someone's home. Also every site visitor's IP and user agent when an image is served |
| **Personal data** | Yes — uploaded images, and visitor IPs |
| **Stores it** | Yes, until deleted |
| **Region** | Cloudinary's CDN — global |
| **Code** | `src/lib/cloudinary.ts`, `src/actions/upload.ts` |
| **Deletion** | `destroyUpload()` runs on erasure, with a retry in `/admin/privacy` |

Uploads go **browser → Cloudinary directly** with a server-issued signature, so
the image never transits our server. This is better for our data footprint and
means Cloudinary sees the customer's IP.

## Upstash (Redis)

| | |
|---|---|
| **Purpose** | Rate limiting and password-reset tokens |
| **Data sent** | Rate-limit keys containing the login email and the client IP; password-reset entries mapping a SHA-256 token to an email address |
| **Personal data** | Yes — email and IP, briefly |
| **Stores it** | ≤1 hour, TTL-expired |
| **Region** | **VERIFY IN CONSOLE** |
| **Code** | `src/lib/redis.ts`, `src/actions/auth.ts` |

## Google Maps

| | |
|---|---|
| **Purpose** | Showroom location map on `/showroom` |
| **Data sent** | Visitor IP, user agent, referrer, and Google's own cookies |
| **Personal data** | Yes — IP address |
| **Loaded** | **Only on click.** Changed in this work; it previously loaded on every page render |
| **Code** | `src/components/sections/ShowroomFaqContact.tsx` |

A plain "Get directions" link is offered alongside, so the showroom address is
reachable without contacting Google at all.

## Google Fonts

`next/font/google` self-hosts the fonts at build time. **No runtime request to
Google and no visitor data sent.** Listed only to record that it was checked.

## Unsplash

`images.unsplash.com` is an allowed image host (`next.config.ts`) for seed
placeholder images. Visitor IP is sent when such an image is served. No customer
data. Should be removed once real product photography replaces the seeds.

## Razorpay

Scaffolded (`src/lib/razorpay.ts`) but **not wired up** — `getRazorpayKeyId()`
and `isRazorpayConfigured()` have no callers, and `paymentMethod` is hardcoded
to COD. **No data is sent to Razorpay today.**

If online payments are enabled later, this document and the privacy notice must
be updated **before** the first live transaction: a payment processor receiving
name, email, phone and amount is a new processor and a new disclosure.

---

## Services deliberately NOT used

Verified absent from `src/` and `package.json`: Google Analytics, Google Tag
Manager, Vercel Analytics, Speed Insights, PostHog, Sentry, Meta Pixel, and
**any AI or LLM API**.

**No personal data is sent to any AI service.** There is no LLM integration in
this application. If one is added, DPDP obligations apply to the payload:
minimise it, strip identifiers, never send passwords or tokens, and disclose it
in the notice before it goes live.

## Actions required

1. **Confirm the Resend and Upstash regions** from their dashboards and replace
   the VERIFY markers above. Vercel (`icn1`) and Supabase (`ap-northeast-2`) are
   both Seoul and are confirmed — the first from `vercel.json`, the second from
   the database host.
2. **Obtain data processing agreements** with Supabase, Vercel, Resend,
   Cloudinary and Upstash. DPDP §8(2) makes the fiduciary responsible for its
   processors' compliance regardless of contract, but the contract is how you
   evidence diligence. **REQUIRES LEGAL REVIEW.**
3. **Review §16 restrictions periodically.** The Act lets the Government restrict
   transfers to specified countries. None of the countries used is currently
   restricted, but that is a list which can change.
