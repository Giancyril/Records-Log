-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'ARCHIVED';
ALTER TYPE "ActivityAction" ADD VALUE 'UNARCHIVED';
ALTER TYPE "ActivityAction" ADD VALUE 'BULK_CREATED';

-- AlterTable
ALTER TABLE "records" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;
