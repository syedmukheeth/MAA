-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "optionsSummary" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mrp" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "ComboItemOption" (
    "id" TEXT NOT NULL,
    "comboItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "ComboItemOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartComboSelection" (
    "id" TEXT NOT NULL,
    "cartItemId" TEXT NOT NULL,
    "comboItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "CartComboSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComboItemOption_comboItemId_variantId_key" ON "ComboItemOption"("comboItemId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "CartComboSelection_cartItemId_comboItemId_key" ON "CartComboSelection"("cartItemId", "comboItemId");

-- AddForeignKey
ALTER TABLE "ComboItemOption" ADD CONSTRAINT "ComboItemOption_comboItemId_fkey" FOREIGN KEY ("comboItemId") REFERENCES "ComboItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItemOption" ADD CONSTRAINT "ComboItemOption_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartComboSelection" ADD CONSTRAINT "CartComboSelection_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartComboSelection" ADD CONSTRAINT "CartComboSelection_comboItemId_fkey" FOREIGN KEY ("comboItemId") REFERENCES "ComboItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartComboSelection" ADD CONSTRAINT "CartComboSelection_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
