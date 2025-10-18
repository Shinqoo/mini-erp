/*
  Warnings:

  - You are about to drop the column `paymentIntentId` on the `Refund` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "Refund" DROP COLUMN "paymentIntentId";
