-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'ANNUAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PlanId" ADD VALUE 'STARTER';
ALTER TYPE "PlanId" ADD VALUE 'AVANZADO';

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "billing_period" "BillingPeriod";

