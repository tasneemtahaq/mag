-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "payerReference" TEXT,
ADD COLUMN     "receiptSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionNote" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankAccountTitle" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "bankIban" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "easypaisaNumber" TEXT,
ADD COLUMN     "easypaisaTitle" TEXT,
ADD COLUMN     "jazzcashNumber" TEXT,
ADD COLUMN     "jazzcashTitle" TEXT,
ADD COLUMN     "paymentNote" TEXT;

-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "format" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_publicId_key" ON "PaymentReceipt"("publicId");

-- CreateIndex
CREATE INDEX "PaymentReceipt_paymentId_idx" ON "PaymentReceipt"("paymentId");

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
