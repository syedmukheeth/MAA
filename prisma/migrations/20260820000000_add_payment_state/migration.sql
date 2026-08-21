-- Payment verification for COD + manual UPI.
--
-- Before this migration, Order.paymentMethod was free-form TEXT written straight
-- from the checkout payload, and nothing recorded whether an order had been paid.
-- Both cancel paths inferred "was this paid?" from that untrusted string, so a
-- customer could place a UPI order without paying, cancel it, and land in the
-- admin refund queue for the full order total.
--
-- Two changes:
--   1. paymentMethod becomes an enum, so only COD/UPI can ever be stored.
--   2. paymentState records whether the money actually arrived. Only PAID may
--      queue a refund.
--
-- The paymentMethod cast is deliberately strict: any legacy row holding
-- something other than 'COD'/'UPI' aborts this migration rather than being
-- silently coerced. If that happens, look at the rows before deciding.

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'UPI');

-- CreateEnum
CREATE TYPE "PaymentState" AS ENUM ('UNPAID', 'AWAITING_VERIFICATION', 'PAID');

-- AlterTable: TEXT -> PaymentMethod
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" DROP DEFAULT;
ALTER TABLE "Order"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod"
  USING (upper(trim("paymentMethod")))::"PaymentMethod";
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" SET DEFAULT 'COD';

-- AlterTable: payment state + verification trail
ALTER TABLE "Order" ADD COLUMN     "paymentState" "PaymentState" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "paymentVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "paymentVerifiedById" TEXT;

-- Backfill: existing non-COD orders were treated as paid by the old refund
-- logic, so they are PAID here. Anything else would rewrite history — either
-- inventing refunds that were never owed or erasing ones that were.
UPDATE "Order" SET "paymentState" = 'PAID' WHERE "paymentMethod" <> 'COD';
