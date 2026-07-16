# MAA FURNITURE — Handover

**Date:** 2026-07-16
**State:** Phases 1–5 complete and verified. Phase 6 ~60% done. Phase 7 not started.
**Tree:** `tsc` clean · `eslint` 0 warnings · 18/18 tests pass · `ship-check` 6 passed / 0 failed / 3 skipped.
**Nothing is committed.** ~60 changed files sitting in the working tree.

Read §1 and §2 before touching anything. They contain decisions that are not
recoverable from the code, and two things that will actively mislead you.

---

## 1. STOP — things that will bite you

### 1.1 `.dark` is the ADMIN THEME. Never delete it.
An earlier audit in this project claimed "`.dark` is never applied." **That was
false.** It is applied in 5 places and is what makes the entire back office dark:

- `src/app/(admin)/admin/layout.tsx:18` — the admin shell
- `ConfirmDialog.tsx`, `InventoryTable.tsx` (×2), `Topbar.tsx` — dialogs/sheets

It is **not** a public dark-mode toggle. The storefront is always light. Deleting
`.dark` blanks the admin to white-on-white.

### 1.2 The migration has NOT been applied to production
`prisma/migrations/20260716120000_add_tax_delivery_testimonials_audit/migration.sql`
is **hand-written and unapplied**. It was deliberately not run: `DATABASE_URL`
points at live Supabase.

```bash
npx prisma migrate deploy     # apply it (owner's call, not yours)
npx prisma generate           # already run; client is current with the schema
```

**The code already assumes these columns exist.** Until the migration runs, any
order placement or audit write will fail at runtime. `tsc` passes because the
generated client matches the *schema file*, not the database.

### 1.3 `revalidate` is inert on every `(shop)` page
`src/app/(shop)/layout.tsx` calls `getCurrentUser()` → `cookies()` → the whole
route group renders dynamic. `next build` confirms: `ƒ /products/[slug]`.

The `revalidate = 300` exports are **not working**. They are left in place
deliberately (they go live the moment the cookie read moves) and the constraint
is documented at the top of that layout.

This does **not** affect SEO — dynamic means SSR, crawlers get full HTML. It
costs caching only. Fixing it properly is an architectural decision: either the
Next 16 Cache Components migration or a client-side session read. Don't slip
either in casually.

### 1.4 Next 16 is not the Next.js you know
`AGENTS.md` is serious about this. Caching was replaced by **Cache Components**
(`cacheComponents: true` + `"use cache"`); `revalidate` is the "previous model".
Routing uses `src/proxy.ts`, **not** `middleware.ts`.

**Read `node_modules/next/dist/docs/` before writing anything.** Specifically
`01-app/01-getting-started/08-caching.md` and `02-guides/caching-without-cache-components.md`.

### 1.5 Client components must NOT import `@/lib/money`
`money.ts` imports Prisma for `Decimal` → drags `node:module` into the browser
bundle → **the build fails**. This already happened once.

- Client components → `import { formatINR } from "@/lib/format"` (isomorphic)
- Server only → `@/lib/money` (Decimal arithmetic, re-exports `formatINR`)

`tsc` does **not** catch this. Only `next build` does. Run it.

### 1.6 Commits in this repo: no `Co-Authored-By` trailer
Vercel Hobby blocks deploys when a co-author isn't a project member. Do not add
the trailer to commits in this repo.

---

## 2. Decisions already made (do not relitigate)

| Decision | Choice | Why |
|---|---|---|
| Login gate | **Un-gated** the catalogue | `/`, `/products/*`, `/combos/*` public; `/cart`, `/checkout`, `/account`, `/admin` gated. Reverses the earlier "login-first" request — SEO + WhatsApp previews were worth more. |
| Dark mode | **Kept and fixed** | See §1.1. Original plan said delete; that was based on bad information. |
| Payments | **COD only** | No Razorpay. Money bugs fixed instead (Decimal, order numbers, GST, delivery). |
| GST | **Inclusive** | Displayed prices include GST; tax is *extracted* for invoicing, never added at checkout. Rate frozen per-order. |
| Fake testimonials | **Build model, remove fakes** | Fabricated reviews are a CCPA / BIS IS 19000:2022 problem. Section hides when empty. |
| BestSellers / Collections | **Wire to real DB** | Currently invented products that don't exist. |
| Workshop photos | **Unresolved** | See §5. |

---

## 3. What's DONE (verified, don't redo)

### Phase 0 — the three criticals
- **Privilege escalation** `src/actions/users.ts` — rank model (`OWNER 3 > ADMIN 2 > MANAGER 1 > CUSTOMER 0`). No self-role change in any direction; can't act on someone who outranks you; **can't grant a role above your own**; can't strand zero owners. Runtime role validation added (the TS type is erased — callers can POST anything).
- **Cloudinary images** `next.config.ts` — added `res.cloudinary.com`. Every uploaded product image previously crashed its page.
- **Email amplifier** `src/app/api/custom-requests/route.ts` — 5/hour per IP, checked *before* parsing/DB. **Fails closed** (503) — unbounded staff inbox flood is worse than a briefly broken form.

### Phase 1 — un-gate + resilience
- `src/proxy.ts` — matcher now only private routes.
- `src/lib/auth/session.ts` — `requireRole`/`requireAuth` **redirect** (`/403`, `/login`) instead of throwing 500s. `getActiveUser()` exported.
- `addToCart` returns `{ requiresAuth: true }` — anon add-to-cart is a normal path now, not an error.
- `error.tsx`, `global-error.tsx`, `not-found.tsx` added (there were none).
- Login rate-limited by **email AND IP**; **fails open** (a limiter must never be why nobody can sign in). Note the deliberate asymmetry with §Phase 0 custom-requests, which fails closed.
- **BONUS FIX:** open redirect. `next.startsWith("/")` accepted `//evil.com` (protocol-relative) → post-login phishing. `safeNextPath()` in `auth.ts`, 16/16 attack strings.

### Phase 2 — money
- `src/lib/money.ts` — Decimal helpers. `taxWithin()` extracts GST from an inclusive price.
- `src/lib/format.ts` — isomorphic `formatINR` (en-IN lakh grouping).
- `src/lib/cart.ts` → `computeCartTotals()` — **single source of truth** for cart, checkout, and `placeOrder`. Previously three independent calculations = drift (page shows one number, order charges another).
- Order number `MAA-{ts}-{6hex}` — the old `Date.now()` collided in the same millisecond and rolled back the *second customer's* whole checkout.
- `src/components/shop/OrderTotals.tsx` — delivery + GST shown before the final step.
- **18 vitest tests**, incl. one reproducing the float error the old code was exposed to. `npm test`.

### Phase 3 — design system
- token-lint **38 literals → 0**. contrast **20/20 AA**.
- `--bronze` `0.6 → 0.52`: was **3.83:1** (failed AA on the Add-to-Cart button) → now **5.36:1**. This is the "bronze too faint on mobile" report in `updates01.md`.
- New `--gold` `oklch(0.83 0.095 81)` — exact `#E6C280` match, 9.69:1 AAA on dark. Replaced all 13 hardcodes.
- **Root cause of every hardcode:** `.dark` never redeclared brand tokens, so the admin had no dark-surface accent and no warm card. People hardcoded what the system wouldn't give them. Fixed the scope; the bypasses became unnecessary.
- `sidebar-primary` was shadcn **violet** — now bronze.

### Phase 4 — motion + a11y
- `MotionProvider` (`<MotionConfig reducedMotion="user">`) at root. **Verified in library source**: `motion-dom` `positionalKeys` includes `transformPropOrder` (scale/x/y) → those become `{type:false}` under reduced motion while opacity still animates. So the 8s Ken Burns and infinite chevron both stop. WCAG 2.3.3.
- CSS `@media (prefers-reduced-motion)` block for keyframes Framer can't see.
- **GSAP uninstalled** (−34kB). ScrollTrigger was only a scroll *sensor* → `IntersectionObserver` + sentinels.
- **BUG FIXED:** desktop Craftsmanship progress-bar clicks did nothing (`scrollToStep` only scrolled on mobile; the sensor overwrote `setActive`).
- `aria-current="step"`, `aria-live="polite"`, focus-visible outlines.

### Phase 5 — SEO
- `sitemap.ts` (DB-generated, fails soft to static routes — an empty sitemap tells Google the pages are gone), `robots.ts`, `opengraph-image.tsx` (Satori).
- `generateMetadata` + OG + canonical on `products/[slug]`, `combos/[slug]`, `/products`.
- JSON-LD `Product` schema with price + availability (`src/components/seo/JsonLd.tsx`, XSS-escaped).
- Root `metadataBase` + `title.template`.
- Pagination on `/products` (was an unbounded `findMany`).

### Phase 6 (partial) — audit log
- `src/lib/audit.ts` — `recordAudit()` (best-effort; never rolls back the business action), `diff()` (stringified — Decimal/Date don't survive JSONB).
- Wired: `users.role_change`, `users.set_active`, `product.delete`, `combo.delete`, `combo.toggle_active`, `order.status_change`/`order.cancel` (inside the tx), `inventory.receive`, `inventory.adjust`, `settings.update`, `request.status_change`.
- `src/app/(admin)/admin/audit/page.tsx` — **OWNER-only**, no delete action (a log its subjects can curate isn't a control). Sidebar entry added.
- `permissions/page.tsx` updated with the new real capabilities.

---

## 4. WHAT'S LEFT — pick up here

### 4.1 Finish Phase 6 (in progress — this is where I stopped)

**Testimonials.** Schema + validation exist; nothing else does.
- ✅ `Testimonial` model in `prisma/schema.prisma`
- ✅ `src/lib/validations/testimonial.ts`
- ❌ `src/actions/testimonials.ts` — create/update/delete/publish. Mirror `src/actions/combos.ts` for shape. **Add `recordAudit`** — the `testimonial.*` actions are already declared in `AuditAction`.
- ❌ Admin UI — `src/app/(admin)/admin/testimonials/` + sidebar entry (`roles: ["OWNER","ADMIN"]`). Mirror `ComboTable`/`ComboForm`.
- ❌ `src/components/sections/Testimonials.tsx` — **currently 3 fabricated testimonials with stock-photo faces.** Replace with real published rows; **render nothing when empty**. Do not invent replacements.

**BestSellers.** `src/components/sections/BestSellers.tsx` — 4 hardcoded products that don't exist in the DB, at invented prices, **not even clickable**. Wire to `prisma.product.findMany({ where: { featured: true }, take: 4 })`, link each to `/products/[slug]`, use `formatINR`.

**Collections.** `src/components/sections/Collections.tsx` — 5 hardcoded categories. Wire to real `RoomCategory` values + counts.

Both are server components taking props from `src/app/page.tsx` (see `Hero`/`TrustBuilders` for the existing pattern — they already take DB props).

**Saved addresses.** `tobeupadted.md` asked for it. Checkout already pre-fills from the last order (`checkout/page.tsx`), which covers ~80%. A real `Address` model + picker is the remainder.

**Password reset.** Absent entirely. Resend is wired (`src/lib/email.ts`). Needs a token model + `/forgot-password` + `/reset-password`. Users are currently locked out permanently.

### 4.2 Phase 7 — final gate + docs
```bash
npx next build                        # MUST pass — catches client/server bundle leaks tsc can't
node ~/.claude/skills/ship-check/scripts/ship-check.mjs . --build --allow VariantPicker
npm run dev
node ~/.claude/skills/ship-check/scripts/ship-check.mjs . --url http://localhost:3000 --allow VariantPicker
```
The `--url` run enables the **a11y (axe)** and **perf (Lighthouse)** checks, which are the 3 currently reporting **SKIP — not verified**. They need `npm i -D @axe-core/cli lighthouse`.

- `README.md` is still untouched create-next-app boilerplate.
- `.env.example` exists on disk but is **gitignored** by the `.env*` rule → a new dev clones and gets no template. Add a `!.env.example` negation.

### 4.3 Still open from the original audit
- **No CI.** Add typecheck + lint + test on PR.
- **Emails are fire-and-forget** — `sendEmail` swallows failures with a `console.error`. An order confirmation can vanish silently. Needs a queue/retry.
- **No search** — only category filter. ULTRAPLAN §0 promises search.
- **`admin/layout.tsx` uses `getCurrentUser()`** (JWT only, no DB re-check). Pages call `requireRole` which does re-check, so it's safe — but a demoted admin's stale 7-day JWT still renders the shell before the page redirects.
- **JWT has no rotation/refresh.** 7-day tokens carry whatever role they were minted with.

---

## 5. Needs the OWNER, not an agent

1. **Apply the migration** (§1.2). Owner's call against production.
2. **Rotate `JWT_SECRET`.** Tokens minted before the privilege-escalation fix still carry their original role claim for up to 7 days.
3. **Audit the `User` table** for unexpected OWNERs — check whether the escalation hole was ever used (`updatedAt` drifted past `createdAt` on any OWNER/ADMIN row). I attempted this and was correctly blocked from reading the production DB.
4. **Workshop photography.** `Craftsmanship.tsx` uses 6 Unsplash images to depict "our Kurnool workshop", and `Materials`/`RoomInspirations` are similar. That's stock photos presented as your own workshop. No code fixes it — it needs real photos. Left as-is pending a decision.
5. **GST rate + delivery fee.** Schema defaults to 18% / ₹0 / no free-delivery threshold. Configure in `/admin/settings` (fields exist in the model; **the settings form UI does not expose them yet** — that's a small gap worth closing).

---

## 6. Tooling you have

Three personal skills at `~/.claude/skills/` do real work here — they are not decorative:

```bash
# Contrast — real WCAG math on the token file. Exits 1 on failure.
node ~/.claude/skills/brand-system/scripts/contrast.mjs src/app/globals.css
node ~/.claude/skills/brand-system/scripts/contrast.mjs --color "#E6C280:#1a1a1a"

# Token lint — hardcoded colours bypassing the theme. Currently 0.
node ~/.claude/skills/brand-system/scripts/token-lint.mjs src --allow VariantPicker

# The gate. A SKIP is NOT a pass — it means the check didn't run.
node ~/.claude/skills/ship-check/scripts/ship-check.mjs . --allow VariantPicker
```

**`--allow VariantPicker` is deliberate**, not a cheat: `src/components/shop/VariantPicker.tsx` holds timber swatch hexes where the colour *is product data* (teak is teak — it must not shift with the theme). `global-error` and `opengraph-image` are allowed by default for the same class of reason (no stylesheet available in either runtime).

Also: `industry-packs` → `~/.claude/skills/industry-packs/reference/packs/commerceos.md`. MAA is CommerceOS. Buyer's core fear: **"will I lose my money."** Section order, trust placement, and §11's hard constraints all derive from that. §11 is why the site got un-gated.

---

## 7. Verify you haven't broken anything

```bash
npx tsc --noEmit            # expect 0
npx eslint .                # expect 0 warnings
npm test                    # expect 18/18
npx next build              # expect pass — the only thing that catches bundle leaks
node ~/.claude/skills/ship-check/scripts/ship-check.mjs . --allow VariantPicker
```

Known-answer check for the token linter (proves it's actually working, not just green):
```bash
# Should report exactly 6 — the timber swatches
node ~/.claude/skills/brand-system/scripts/token-lint.mjs src/components/shop/VariantPicker.tsx
```

Manual checks nothing automated covers:
- Turn on OS reduced motion → **the hero must not zoom**. If it does, `MotionProvider` isn't wired.
- Upload a product image in `/admin/products/new` → view its public page. Verifies the Cloudinary fix.
- `POST /api/custom-requests` six times → expect **429** on the sixth.
- Log in as ADMIN → try to make yourself OWNER via the users table. Must fail. (The dropdown is disabled client-side, but the *server* is the control — server actions are callable directly.)
