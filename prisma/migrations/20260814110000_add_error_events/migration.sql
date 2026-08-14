-- Application error monitoring.
--
-- Grouped by fingerprint rather than one row per occurrence: an error firing
-- ten thousand times is one row with a count. A per-occurrence table becomes
-- unreadable exactly when something is badly broken, which is when it most
-- needs to be readable.
--
-- Messages are scrubbed of personal data before insert (see
-- src/lib/monitoring/scrub.ts). This matters more than it sounds: a Prisma
-- error interpolates the failing query's parameters into its message, and for
-- placeOrder those parameters are the customer's shipping name, phone number
-- and street address. An unfiltered error store would quietly become one of the
-- largest collections of personal data in the system.
--
-- Additive only.

-- CreateEnum
CREATE TYPE "ErrorSource" AS ENUM ('SERVER', 'CLIENT', 'CRON');

-- CreateTable
CREATE TABLE "ErrorEvent" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "source" "ErrorSource" NOT NULL,
    "message" TEXT NOT NULL,
    "name" TEXT,
    "route" TEXT,
    "stack" TEXT,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "alertedAt" TIMESTAMP(3),

    CONSTRAINT "ErrorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Unique: the fingerprint IS the identity, and captureError upserts on it.
CREATE UNIQUE INDEX "ErrorEvent_fingerprint_key" ON "ErrorEvent"("fingerprint");

-- CreateIndex
CREATE INDEX "ErrorEvent_lastSeenAt_idx" ON "ErrorEvent"("lastSeenAt");

-- CreateIndex
CREATE INDEX "ErrorEvent_resolvedAt_lastSeenAt_idx" ON "ErrorEvent"("resolvedAt", "lastSeenAt");

-- Same RLS posture as every other table; new tables do not inherit it.
ALTER TABLE "ErrorEvent" ENABLE ROW LEVEL SECURITY;
