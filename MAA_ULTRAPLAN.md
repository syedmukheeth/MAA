# MAA FURNITURES — ULTRAPLAN v2.0
### From landing page → full premium e-commerce + inventory + operations platform

> **How to use this file:** Save as `PLAN.md` in the repo root. Tell Claude Code:
> *"Read PLAN.md fully. Execute Phase 0, show me the result, then wait for my approval before each next phase. Never skip the design system rules."*
> Each phase is independently shippable. Do NOT let Claude Code attempt everything in one shot.

---

## 0. CURRENT STATE & TARGET STATE

**Current (maa-pi.vercel.app):** Single-page Next.js marketing site. Static content, no auth, no database, no products backend, forms don't persist, all images from Unsplash.

**Target:** Full-stack platform with:
- Public storefront (browse, search, cart, checkout, custom design requests)
- Customer accounts (orders, tracking, wishlist, saved designs)
- Staff back-office with 3 tiers: **Admin → Manager → Owner** (increasing power)
- Inventory tracking with stock movements, low-stock alerts
- Product CRUD, variants (wood/finish/size), combo offers, coupons
- Custom Design Studio pipeline (request → quote → approval → production → delivery)
- Analytics dashboard for Owner
- Premium furniture-brand design system with tasteful animation

---

## 1. TECH STACK (locked — do not deviate)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14+ App Router, TypeScript** | Already deployed on Vercel; SSR for SEO on product pages |
| Database | **PostgreSQL via Supabase** (or Neon) | Free tier to start, row-level security, realtime for inventory |
| ORM | **Prisma** | Type-safe schema, easy migrations |
| Auth | **NextAuth v5 (Auth.js)** — credentials + Google OAuth, role in JWT | One auth system, 4 roles via `role` enum |
| State | **Zustand** (cart), React Query/TanStack Query (server data) | Simple, no Redux bloat |
| Styling | **Tailwind CSS + CSS variables** for the design tokens below | |
| Animation | **Framer Motion** + Lenis smooth scroll | Premium feel, GPU-friendly |
| Images | **UploadThing** or Supabase Storage; `next/image` everywhere | Replace ALL Unsplash images with real product uploads |
| Payments | **Razorpay** (India: UPI, cards, netbanking) — test mode first | COD option too — furniture buyers in Kurnool expect it |
| Email/WhatsApp | Resend for email; WhatsApp deep-links (`wa.me`) for order updates in v1 | |
| Validation | **Zod** on every API route and form | |
| Charts | **Recharts** for Owner dashboard | |

Repo stays a single Next.js app. Route groups: `(storefront)`, `(account)`, `(backoffice)`.

---

## 2. ROLES & PERMISSIONS MATRIX (the 4 logins)

Single login page at `/login`. After auth, redirect by role. `role` enum: `CUSTOMER | ADMIN | MANAGER | OWNER`.

| Capability | Customer | Admin | Manager | Owner |
|---|---|---|---|---|
| Browse, cart, checkout, wishlist | ✅ | ✅ | ✅ | ✅ |
| View own orders, track delivery | ✅ | — | — | — |
| Submit custom design requests | ✅ | — | — | — |
| View/manage ALL orders, update status | — | ✅ | ✅ | ✅ |
| Product CRUD (add/edit/delete, images, variants) | — | ✅ | ✅ | ✅ |
| Inventory: adjust stock, receive stock, view movements | — | ✅ | ✅ | ✅ |
| Combo offers & coupons: create/edit/disable | — | ❌ view only | ✅ | ✅ |
| Set prices & discounts | — | ❌ | ✅ | ✅ |
| Respond to custom design requests, send quotes | — | ✅ | ✅ | ✅ |
| Delete orders / issue refunds | — | ❌ | ✅ | ✅ |
| Analytics dashboard (revenue, profit, best sellers) | — | ❌ | ✅ limited | ✅ full |
| Manage staff accounts (create Admin/Manager) | — | ❌ | ❌ | ✅ |
| Site settings (banners, showroom hours, homepage content) | — | ❌ | ✅ | ✅ |
| Audit log (who changed what) | — | ❌ | ❌ | ✅ |

**Enforcement:** middleware guards `/backoffice/*` routes by role; every mutation API re-checks role server-side (never trust the client); Prisma-level `AuditLog` row on every staff mutation.

Seed script must create one account of each role with obvious test credentials.

---

## 3. DATABASE SCHEMA (Prisma — core models)

```prisma
model User        { id, name, email, phone, passwordHash?, role Role, addresses Address[], orders Order[], wishlist WishlistItem[], designRequests DesignRequest[], createdAt }
model Address     { id, userId, line1, city, state, pincode, phone, isDefault }

model Category    { id, name, slug, room String, heroImage, sortOrder }   // Living, Bedroom, Dining, Office, Outdoor
model Product     { id, name, slug, description, categoryId, basePrice Int, salePrice Int?, sku, images Image[], variants Variant[], materials String[], dimensions Json, warrantyYears Int, isPublished, isFeatured, avgRating, createdAt }
model Variant     { id, productId, name, woodType, finish, size, priceDelta Int, sku, stock Int, lowStockThreshold Int @default(3) }
model Image       { id, productId, url, alt, sortOrder }

model StockMovement { id, variantId, type StockType, qty Int, reason, orderId?, byUserId, createdAt }
enum StockType   { RECEIVED, SOLD, RETURNED, DAMAGED, ADJUSTMENT }

model Order       { id, orderNo, userId, items OrderItem[], subtotal, discount, deliveryFee, total, status OrderStatus, paymentMethod, paymentId?, addressId, timeline OrderEvent[], createdAt }
model OrderItem   { id, orderId, variantId, nameSnapshot, priceSnapshot, qty, comboOfferId? }
model OrderEvent  { id, orderId, status, note, byUserId?, createdAt }
enum OrderStatus { PENDING, CONFIRMED, IN_PRODUCTION, READY, SHIPPED, DELIVERED, CANCELLED, REFUNDED }

model ComboOffer  { id, title, description, image, products ComboItem[], comboPrice Int, startsAt, endsAt, isActive, maxRedemptions? }
model ComboItem   { comboOfferId, variantId, qty }
model Coupon      { id, code, type PERCENT|FLAT, value, minOrder, maxUses, usedCount, expiresAt, isActive }

model DesignRequest { id, userId?, name, phone, inspirationUrl?, images Image[], dimensions, woodType, finish, budgetRange, description, status DesignStatus, quoteAmount?, quoteNote?, assignedToId?, messages DesignMessage[], createdAt }
enum DesignStatus { NEW, REVIEWING, QUOTED, APPROVED, IN_PRODUCTION, COMPLETED, DECLINED }

model Review      { id, productId, userId, rating, title, body, images, isApproved, createdAt }
model AuditLog    { id, userId, action, entity, entityId, before Json?, after Json?, createdAt }
model SiteSetting { key, value Json }   // banners, showroom hours, delivery fee rules
```

**Inventory rules (critical):**
- Stock lives on `Variant.stock`, NEVER edited directly — only via `StockMovement` rows inside a transaction (movement insert + stock increment/decrement atomically).
- Order confirmation decrements stock; cancellation/refund restores it with a `RETURNED` movement.
- Checkout re-validates stock server-side; oversell returns a friendly "only X left" error.
- Low-stock: any variant where `stock <= lowStockThreshold` appears on backoffice dashboard with an amber badge + optional email to Owner.

---

## 4. PREMIUM DESIGN SYSTEM — "Heritage Modern"

This is where the ₹20-lakh feel comes from. Claude Code must define these as CSS variables in `globals.css` and NEVER hardcode colors.

### 4.1 Color palette (warm wood + charcoal + brass)
```css
--bg:            #FAF7F2;   /* warm ivory — page background */
--bg-elevated:   #FFFFFF;
--ink:           #1C1917;   /* near-black warm charcoal — headings */
--ink-soft:      #57534E;   /* body text */
--walnut:        #5C4033;   /* primary brand — deep walnut */
--teak:          #8B5E3C;   /* hover/secondary */
--brass:         #B08D57;   /* accent — CTAs, prices, focus rings */
--sage:          #7A8B6F;   /* success / in-stock */
--terracotta:    #C1543C;   /* sale tags, destructive */
--linen:         #EDE7DD;   /* card borders, dividers */
--backoffice-bg: #141210;   /* dark charcoal — the entire back-office is DARK themed */
--backoffice-panel: #1E1B18;
```
Storefront = light warm theme. Back-office = dark charcoal with brass accents (instantly feels like a pro tool, visually separates "shopping" from "working").

### 4.2 Typography
- **Headings:** `Fraunces` (Google Fonts, optical sizing on) — serif with character, fits handcrafted furniture. Weights 400/600.
- **Body/UI:** `Inter` or `Instrument Sans`. 
- **Prices & SKUs:** tabular numerals (`font-variant-numeric: tabular-nums`).
- Scale: hero 64/72px desktop → 36px mobile; generous line-height 1.6 on body; letter-spacing -0.02em on large headings.

### 4.3 Animation language (Framer Motion) — restrained, expensive-feeling
- **Page load:** hero text lines reveal with a soft clip-path rise, 80ms stagger. No bouncy springs — use `ease: [0.22, 1, 0.36, 1]`, 0.7s.
- **Scroll:** sections fade+rise 24px once (`whileInView`, `viewport={{ once: true }}`); Lenis smooth scrolling.
- **Product cards:** on hover, image scales 1.04 with `overflow-hidden`, second image cross-fades in, brass underline slides under name. 300ms.
- **Product page:** gallery with drag-to-swipe, pinch zoom on mobile; wood/finish swatch selection morphs price with a number roll animation.
- **Cart:** slide-in drawer from right, item add flies a mini-thumbnail to the cart icon.
- **Craftsmanship section:** keep the existing 6-step story, upgrade to horizontal scroll-linked sequence (`useScroll` + `useTransform`) on desktop.
- **Back-office:** minimal animation — 150ms fades only. Speed > delight for staff.
- Respect `prefers-reduced-motion` everywhere.

### 4.4 Component quality bar
- Buttons: 2 variants only (solid walnut, outline brass). 48px tall, subtle inner shadow, brass focus ring.
- Cards: 1px `--linen` border, 12px radius, NO drop shadows on storefront (flat, editorial); shadows allowed in back-office.
- Skeleton loaders shaped like real content, shimmer in `--linen`.
- Empty states with a line-drawn furniture illustration + one CTA.
- Toasts: bottom-center, ink background, brass accent bar.

---

## 5. SITE MAP

### Storefront `(storefront)`
```
/                      → upgraded homepage (keep story sections, wire to real data)
/collections           → all rooms grid
/collections/[room]    → filterable product grid (price, wood, material, in-stock, sort)
/product/[slug]        → gallery, variant picker (wood/finish/size), price, stock badge,
                          dimensions diagram, materials, reviews, "Complete the room" combos,
                          related products, WhatsApp inquiry button
/combos                → combo offers page (e.g., "Dining Set: table + 6 chairs, save ₹18,000")
/custom-studio         → upgraded design request form (multi-step, image upload, persists to DB)
/cart /checkout        → address → delivery slot → payment (Razorpay / COD) → confirmation
/search                → instant search (name, category, material) with debounce
/track/[orderNo]       → public order tracking timeline (no login needed, orderNo + phone)
```

### Customer `(account)` — `/account/*`
Orders list + detail with visual status timeline, invoices (PDF later), addresses, wishlist, my design requests with quote approve/decline + message thread, profile.

### Back-office `(backoffice)` — `/backoffice/*` (dark theme)
```
/backoffice                    → dashboard: today's orders, revenue, low-stock alerts,
                                 pending design requests, recent activity
/backoffice/products           → table: search/filter, bulk publish/unpublish, CSV export
/backoffice/products/new|[id]  → full editor: images (drag-reorder), variants matrix,
                                 pricing, SEO slug, publish toggle
/backoffice/inventory          → stock levels per variant, receive stock modal,
                                 adjustment with reason, movement history log
/backoffice/orders             → kanban OR table view of orders by status, drag to advance,
                                 detail drawer: items, customer, payment, timeline, print slip
/backoffice/combos             → combo builder: pick products, set combo price,
                                 shows auto-computed savings %, schedule start/end
/backoffice/coupons            → coupon CRUD (Manager+)
/backoffice/design-requests    → pipeline board NEW→QUOTED→APPROVED→PRODUCTION→DONE,
                                 send quote, internal notes, customer message thread
/backoffice/reviews            → approve/reject queue
/backoffice/analytics          → (Manager: sales only; Owner: full) revenue chart,
                                 best sellers, category split, AOV, custom-vs-catalog ratio
/backoffice/staff              → OWNER ONLY: create/disable Admin & Manager accounts
/backoffice/settings           → banners, showroom hours, delivery fee, WhatsApp number
/backoffice/audit              → OWNER ONLY: audit log with diff viewer
```

---

## 6. EXECUTION PHASES FOR CLAUDE CODE

> One phase per session. Run `npm run build` + fix all TypeScript errors before declaring a phase done. Write Playwright smoke tests for auth + checkout in Phase 8.

**Phase 0 — Foundation (½ day)**
Install Prisma, NextAuth, Tailwind tokens, Framer Motion, Zod, Zustand, React Query. Create full Prisma schema above, run first migration, write `seed.ts`: 4 users (one per role), 5 categories, 20 realistic furniture products with variants + stock, 2 combo offers, 3 coupons, sample orders. Set up route groups + role middleware. Deliverable: `npx prisma studio` shows seeded data; `/login` works for all 4 roles and redirects correctly.

**Phase 1 — Design system (1 day)**
Implement all tokens in §4. Build shared UI kit: Button, Input, Select, Card, Badge, Drawer, Modal, Toast, Skeleton, DataTable (sortable/filterable — reused across back-office), StatusPill, EmptyState. Storybook-style preview page at `/dev/ui`. Rebuild the navbar (transparent → solid on scroll, cart icon with count) and footer.

**Phase 2 — Storefront catalog (1–2 days)**
Homepage upgrade wired to real DB (featured products, combos strip, real collections). Collections pages with filters via URL search params. Product detail page with variant picker, stock badge, gallery. Search. All animations from §4.3.

**Phase 3 — Cart & checkout (1–2 days)**
Zustand cart persisted to localStorage, drawer UI, combo-aware pricing, coupon apply, checkout flow, Razorpay test-mode integration + COD, server-side stock validation, order creation in a transaction (decrement stock + movements + order events), confirmation page, order tracking page.

**Phase 4 — Customer account (1 day)**
Orders, order detail with timeline, addresses, wishlist, profile. Design request submission (multi-step form with image upload) + "My Designs" with quote approve/decline and message thread.

**Phase 5 — Back-office core (2 days)**
Dark shell layout with sidebar (items filtered by role). Dashboard. Products CRUD with image upload and variant matrix editor. Inventory page with receive/adjust flows and movement log. Orders management (status advance writes OrderEvent + optional WhatsApp deep-link to customer).

**Phase 6 — Offers & design pipeline (1 day)**
Combo builder, coupons, design-requests pipeline board with quoting. Reviews moderation.

**Phase 7 — Owner layer (1 day)**
Analytics with Recharts (revenue over time, best sellers, low stock, category split, AOV). Staff management. Audit log with before/after diff. Site settings.

**Phase 8 — Polish & hardening (1 day)**
Lighthouse ≥ 90 on storefront, image optimization, SEO (metadata, OG images, product JSON-LD schema), rate limiting on auth + checkout APIs, error boundaries, 404/500 pages on-brand, `prefers-reduced-motion`, mobile QA pass on every page, Playwright smoke tests, README with env setup.

---

## 7. NON-NEGOTIABLE RULES FOR CLAUDE CODE

1. Every API mutation: Zod-validate input → check session role server-side → Prisma transaction → AuditLog (if staff action).
2. Stock changes ONLY through StockMovement transactions. Never `stock = x` directly.
3. No hardcoded colors/fonts — tokens only.
4. Prices stored as integer paise/rupees (Int), formatted with `Intl.NumberFormat('en-IN')` → ₹42,000 style.
5. Every list view needs: loading skeleton, empty state, error state.
6. Mobile-first: the buying audience is heavily mobile; test 375px width on every storefront page.
7. Replace Unsplash images with an `/uploads` flow; keep Unsplash only as seed placeholders clearly named `placeholder-*`.
8. Secrets in `.env` only; add `.env.example`.
9. Never delete products with orders — soft-delete via `isPublished=false` + `deletedAt`.
10. Commit after every phase with a clear message; never force-push.

---

## 8. FUTURE (post-launch backlog — do NOT build now)
PDF invoices, WhatsApp Business API automation, EMI options, 3D/AR product view, delivery partner integration, multi-showroom inventory, GST reports, customer referral program.
