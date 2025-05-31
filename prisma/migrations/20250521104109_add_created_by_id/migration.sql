-- AlterEnum
ALTER TYPE "MemberRole" ADD VALUE 'MEMBER';

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdById" TEXT;
