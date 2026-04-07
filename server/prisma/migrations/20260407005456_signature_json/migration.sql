/*
  Warnings:

  - The `submitterSignature` column on the `records` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `receiverSignature` column on the `records` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "records" DROP COLUMN "submitterSignature",
ADD COLUMN     "submitterSignature" JSONB,
DROP COLUMN "receiverSignature",
ADD COLUMN     "receiverSignature" JSONB;
