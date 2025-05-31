/*
  Warnings:

  - You are about to drop the column `coverImage` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `EventRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `filename` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profileImageId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId,registrantEmail]` on the table `EventRegistration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventCoverForId]` on the table `Image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `EventRegistration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registrantEmail` to the `EventRegistration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_eventImageId_fkey";

-- DropForeignKey
ALTER TABLE "EventRegistration" DROP CONSTRAINT "EventRegistration_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_profileImageId_fkey";

-- DropIndex
DROP INDEX "EventRegistration_eventId_userId_key";

-- DropIndex
DROP INDEX "EventRegistration_userId_idx";

-- DropIndex
DROP INDEX "User_profileImageId_key";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "coverImage",
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "EventRegistration" DROP COLUMN "userId",
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "registrantEmail" TEXT NOT NULL,
ADD COLUMN     "registrantName" TEXT;

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "data",
DROP COLUMN "filename",
DROP COLUMN "height",
DROP COLUMN "mimeType",
DROP COLUMN "size",
DROP COLUMN "width",
ADD COLUMN     "eventCoverForId" TEXT,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "uploaderId" TEXT,
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MembershipPlan" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "userId",
ADD COLUMN     "initiatedById" TEXT,
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "userId",
ADD COLUMN     "managedById" TEXT,
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdById",
DROP COLUMN "profileImageId",
DROP COLUMN "role";

-- DropEnum
DROP TYPE "MemberRole";

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'active',
    "joinDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_adminId_key" ON "Organization"("adminId");

-- CreateIndex
CREATE INDEX "Event_organizationId_idx" ON "Event"("organizationId");

-- CreateIndex
CREATE INDEX "Event_eventImageId_idx" ON "Event"("eventImageId");

-- CreateIndex
CREATE INDEX "EventRegistration_registrantEmail_idx" ON "EventRegistration"("registrantEmail");

-- CreateIndex
CREATE INDEX "EventRegistration_organizationId_idx" ON "EventRegistration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_registrantEmail_key" ON "EventRegistration"("eventId", "registrantEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Image_eventCoverForId_key" ON "Image"("eventCoverForId");

-- CreateIndex
CREATE INDEX "Image_organizationId_idx" ON "Image"("organizationId");

-- CreateIndex
CREATE INDEX "Image_uploaderId_idx" ON "Image"("uploaderId");

-- CreateIndex
CREATE INDEX "Image_eventCoverForId_idx" ON "Image"("eventCoverForId");

-- CreateIndex
CREATE INDEX "MembershipPlan_organizationId_idx" ON "MembershipPlan"("organizationId");

-- CreateIndex
CREATE INDEX "Payment_organizationId_idx" ON "Payment"("organizationId");

-- CreateIndex
CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipPlan" ADD CONSTRAINT "MembershipPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_managedById_fkey" FOREIGN KEY ("managedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_eventCoverForId_fkey" FOREIGN KEY ("eventCoverForId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
