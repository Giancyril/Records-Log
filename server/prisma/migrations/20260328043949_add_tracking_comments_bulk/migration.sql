/*
  Warnings:

  - A unique constraint covering the columns `[trackingCode]` on the table `records` will be added. If there are existing duplicate values, this will fail.
  - The required column `trackingCode` was added to the `records` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'BULK_RECEIVED';
ALTER TYPE "ActivityAction" ADD VALUE 'BULK_RELEASED';

-- AlterTable
ALTER TABLE "records" ADD COLUMN     "trackingCode" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "record_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "record_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "records_trackingCode_key" ON "records"("trackingCode");

-- AddForeignKey
ALTER TABLE "record_comments" ADD CONSTRAINT "record_comments_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_comments" ADD CONSTRAINT "record_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
