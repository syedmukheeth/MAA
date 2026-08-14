-- Breach detection telemetry.
--
-- DPDP s8(6) requires notifying the Data Protection Board and every affected
-- data principal after a breach. That is impossible without a record of what
-- happened and to whom, and the application previously had none: good forensics
-- after the fact via AuditLog, but no detection at all.
--
-- Additive only. Nothing existing is altered.

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM (
  'LOGIN_FAILED',
  'CREDENTIAL_STUFFING_SUSPECTED',
  'PASSWORD_SPRAYING_SUSPECTED',
  'LOGIN_SUCCESS_AFTER_FAILURES',
  'PRIVILEGE_ESCALATION',
  'STAFF_ACCESS_CHANGED',
  'UNAUTHORISED_ACCESS_ATTEMPT',
  'CRON_AUTH_FAILED',
  'BULK_DATA_EXPORT',
  'ERASURE_EXECUTED'
);

-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
-- No foreign key on "userId" is deliberate: a failed login can name an address
-- with no account behind it, and a security log must never become the reason a
-- user row cannot be removed. "ipHash" is a keyed hash, never the address.
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "type" "SecurityEventType" NOT NULL,
    "severity" "SecuritySeverity" NOT NULL,
    "ipHash" TEXT,
    "userId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "alertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_type_createdAt_idx" ON "SecurityEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_severity_createdAt_idx" ON "SecurityEvent"("severity", "createdAt");

-- CreateIndex
-- Supports the spraying detector, which asks "how many distinct accounts has
-- this source failed against recently".
CREATE INDEX "SecurityEvent_ipHash_createdAt_idx" ON "SecurityEvent"("ipHash", "createdAt");

-- Same RLS posture as every other table; new tables do not inherit it.
ALTER TABLE "SecurityEvent" ENABLE ROW LEVEL SECURITY;
