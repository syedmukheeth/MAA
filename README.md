# MAA FURNITURE — E-Commerce Platform & Management System

> **Live Storefront**: [https://maafurniture.shop](https://maafurniture.shop)  
> **Contact Email**: [maafurniture.shop@gmail.com](mailto:maafurniture.shop@gmail.com) / [support@maafurniture.shop](mailto:support@maafurniture.shop)

---

## 🛋️ About MAA FURNITURE

MAA FURNITURE is a modern, high-performance e-commerce platform built for custom handcrafted furniture, living room sets, dining tables, outdoor furniture, and bespoke studio requests. Serving Andhra Pradesh with rich product displays, dynamic combo bundles, and custom request studios.

---

## ✨ Features

- **🛍️ Storefront & Catalogue**: Interactive product filtering by category, wood type, finishes, and dimensions.
- **📦 Smart Combo Bundles**: Configurable multi-item bundle offers with option selections per item.
- **🎨 Custom Studio**: Submit custom furniture requests with inspiration URLs, dimensions, and specifications.
- **🔒 Enterprise Security**: 
  - Token-versioned JWT session security with instant multi-device session revocation on password/role change.
  - Role-based authorization (`OWNER`, `ADMIN`, `MANAGER`, `CUSTOMER`).
  - IP and per-account rate limiting (Upstash Redis sliding window with fallback).
  - CSRF origin verification on API endpoints.
  - Input validation via Zod schemas and XSS HTML sanitization.
- **⚡ Inventory Ledger & Concurrency**: Atomic conditional stock decrements (`stock >= needed`) preventing stock race conditions.
- **📊 Back-Office Management**: Admin dashboard for inventory tracking, order management, refund processing, audit logs, and analytics.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16 (App Router + Turbopack)](https://nextjs.org/)
- **Database & ORM**: PostgreSQL via Supabase Pooler & [Prisma ORM](https://www.prisma.io/)
- **Caching & Rate Limiting**: [Upstash Redis](https://upstash.com/)
- **Authentication**: Custom JWT with `jose` & `bcryptjs`
- **Email Service**: [Resend](https://resend.com/) with custom verified domain `maafurniture.shop`
- **Media Uploads**: [Cloudinary](https://cloudinary.com/) (signed uploads)
- **Styling**: Tailwind CSS & Lucide Icons
- **Testing**: [Vitest](https://vitest.dev/)

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18+ and `npm`
- PostgreSQL Database URL (Supabase recommended)
- Upstash Redis instance
- Resend API key & Cloudinary credentials

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
DATABASE_SSL="true"
JWT_SECRET="your-64-char-random-secret"

NEXT_PUBLIC_SITE_URL="https://maafurniture.shop"

UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

RESEND_API_KEY="re_..."
EMAIL_FROM="MAA FURNITURE <support@maafurniture.shop>"

CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### 3. Installation & Database Sync

```bash
# Install dependencies
npm install

# Push database schema
npx prisma db push

# Seed initial owner & test data
npx prisma db seed
```

### 4. Running Locally

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

```bash
# Run unit & validation test suite
npx vitest run

# Run production build check
npm run build
```

---

## 📄 License

© MAA FURNITURE. All rights reserved.
