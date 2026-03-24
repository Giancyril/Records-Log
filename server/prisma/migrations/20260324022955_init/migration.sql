-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('PENDING', 'RECEIVED', 'RELEASED');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'BULK_DELETED', 'LOGIN', 'REGISTERED', 'CHANGED_PASSWORD', 'CHANGED_EMAIL', 'CHANGED_USERNAME');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "records" (
    "id" TEXT NOT NULL,
    "type" "RecordType" NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'PENDING',
    "documentTitle" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL DEFAULT '',
    "particulars" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "fromOffice" TEXT NOT NULL DEFAULT '',
    "toOffice" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "personName" TEXT NOT NULL,
    "personEmail" TEXT NOT NULL DEFAULT '',
    "personDepartment" TEXT NOT NULL DEFAULT '',
    "personPosition" TEXT NOT NULL DEFAULT '',
    "documentDate" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "remarks" TEXT NOT NULL DEFAULT '',
    "actionTaken" TEXT NOT NULL DEFAULT '',
    "submitterSignature" TEXT,
    "receiverSignature" TEXT,
    "processedById" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activityLogs" (
    "id" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "details" TEXT NOT NULL DEFAULT '',
    "adminId" TEXT,
    "adminName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activityLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activityLogs" ADD CONSTRAINT "activityLogs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
