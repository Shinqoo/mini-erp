-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "status" "RefundStatus" NOT NULL DEFAULT 'PENDING';
