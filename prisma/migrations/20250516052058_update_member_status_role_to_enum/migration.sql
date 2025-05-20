/*
  Warnings:

  - Changed the type of `status` on the `Member` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `Member` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('active', 'pending', 'inactive', 'cancelled');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('admin', 'member', 'editor', 'viewer');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'INCOMPLETE', 'TRIALING');

-- AlterTable
-- First, add the new columns with temporary names, allowing NULLs temporarily if needed and no default
ALTER TABLE "Member"
ADD COLUMN "status_new" "MemberStatus",
ADD COLUMN "role_new" "MemberRole";

-- Update the new columns with data from the old ones, casting appropriately
-- IMPORTANT: This assumes your existing string values are lowercase and match the enum definitions.
-- If they are different (e.g., "Active" instead of "active"), you will need to adjust the CASE statements or use LOWER().
UPDATE "Member" SET
"status_new" = CASE
    WHEN "status" = 'active' THEN 'active'::"MemberStatus"
    WHEN "status" = 'pending' THEN 'pending'::"MemberStatus"
    WHEN "status" = 'inactive' THEN 'inactive'::"MemberStatus"
    WHEN "status" = 'cancelled' THEN 'cancelled'::"MemberStatus"
    ELSE NULL -- Or some default, or raise an error if an unexpected value is found
END,
"role_new" = CASE
    WHEN "role" = 'admin' THEN 'admin'::"MemberRole"
    WHEN "role" = 'member' THEN 'member'::"MemberRole"
    WHEN "role" = 'editor' THEN 'editor'::"MemberRole"
    WHEN "role" = 'viewer' THEN 'viewer'::"MemberRole"
    ELSE NULL -- Or some default, or raise an error
END;

-- Now that data is migrated, drop the old columns
ALTER TABLE "Member"
DROP COLUMN "status",
DROP COLUMN "role";

-- Rename the new columns to their original names and add NOT NULL constraint
ALTER TABLE "Member"
RENAME COLUMN "status_new" TO "status";
ALTER TABLE "Member"
ALTER COLUMN "status" SET NOT NULL;

ALTER TABLE "Member"
RENAME COLUMN "role_new" TO "role";
ALTER TABLE "Member"
ALTER COLUMN "role" SET NOT NULL;

-- The rest of the original ALTER TABLE statement (if any, besides status/role)
ALTER TABLE "Member"
ALTER COLUMN "joinDate" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interval" "BillingInterval" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "stripePriceId" TEXT,
    "features" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "status" "SubscriptionStatus" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "trialStartDate" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlan_stripePriceId_key" ON "MembershipPlan"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
