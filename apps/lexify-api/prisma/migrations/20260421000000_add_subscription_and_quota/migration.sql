-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'NONE');

-- AlterTable: Add subscription + quota columns to User
ALTER TABLE "User"
  ADD COLUMN "subscriptionTier"     "SubscriptionTier"    NOT NULL DEFAULT 'FREE',
  ADD COLUMN "subscriptionStatus"   "SubscriptionStatus"  NOT NULL DEFAULT 'NONE',
  ADD COLUMN "stripeCustomerId"     TEXT,
  ADD COLUMN "stripeSubscriptionId" TEXT,
  ADD COLUMN "dailyLookupCount"     INTEGER               NOT NULL DEFAULT 0,
  ADD COLUMN "dailyLookupResetAt"   TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex: unique constraints for Stripe IDs
CREATE UNIQUE INDEX "User_stripeCustomerId_key"     ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex: unique constraint for PlatformUsage per user/platform/day
CREATE UNIQUE INDEX "PlatformUsage_userId_platform_date_key" ON "PlatformUsage"("userId", "platform", "date");
