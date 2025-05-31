/*
  Warnings:

  - Added the required column `data` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "data" BYTEA NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL;
