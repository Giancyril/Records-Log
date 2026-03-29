import prisma from "../../config/prisma";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";
import { activityLogService } from "../activityLog/activityLog.service";
import {
  CreateRecordInput, UpdateRecordInput,
  ReceiveRecordInput, ReleaseRecordInput,
  BulkReceiveInput, BulkReleaseInput,
  CreateCommentInput,
} from "./records.validate";

// ── Helpers ───────────────────────────────────────────────────────────────────
const recordSelect = {
  id: true, trackingCode: true, type: true, status: true,
  documentTitle: true, documentNumber: true,
  particulars: true, category: true,
  fromOffice: true, toOffice: true, subject: true,
  personName: true, personEmail: true,
  personDepartment: true, personPosition: true,
  documentDate: true, receivedAt: true, releasedAt: true,
  remarks: true, actionTaken: true,
  submitterSignature: true, receiverSignature: true,
  processedById: true, isDeleted: true, isArchived: true,
  archivedAt: true, createdAt: true, updatedAt: true,
  processedBy: { select: { id: true, name: true, username: true } },
};

// ── Create ────────────────────────────────────────────────────────────────────
const createRecord = async (data: CreateRecordInput, adminId: string) => {
  const record = await prisma.record.create({
    data: {
      type:               data.type,
      documentTitle:      data.documentTitle,
      documentNumber:     data.documentNumber ?? "",
      particulars:        data.particulars    ?? "",
      category:           data.category       ?? "",
      fromOffice:         data.fromOffice     ?? "",
      toOffice:           data.toOffice       ?? "",
      subject:            data.subject        ?? "",
      personName:         data.personName,
      personEmail:        data.personEmail        ?? "",
      personDepartment:   data.personDepartment   ?? "",
      personPosition:     data.personPosition     ?? "",
      documentDate:       new Date(data.documentDate),
      remarks:            data.remarks        ?? "",
      submitterSignature: data.submitterSignature,
      processedById:      adminId,
      status:             "PENDING",
    },
    select: { ...recordSelect },
  });

  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, username: true } });
  await activityLogService.createLog({
    action: "CREATED", entityType: "Record",
    entityId: record.id, entityName: record.documentTitle,
    details: `${record.type} record — "${record.documentTitle}" from ${record.personName}`,
    adminId, adminName: admin?.name || admin?.username,
  });

  return record;
};

// ── Get list ──────────────────────────────────────────────────────────────────
const getRecords = async (query: Record<string, any>) => {
  const page     = Number(query.page)  || 1;
  const limit    = Number(query.limit) || 10;
  const skip     = (page - 1) * limit;
  const type     = query.type     as string | undefined;
  const status   = query.status   as string | undefined;
  const search   = query.search   as string | undefined;
  const dateFrom = query.dateFrom as string | undefined;
  const dateTo   = query.dateTo   as string | undefined;

  const where: any = { isDeleted: false };
  where.isArchived = query.isArchived === "true";

  if (type)   where.type   = type;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { documentTitle:  { contains: search, mode: "insensitive" } },
      { documentNumber: { contains: search, mode: "insensitive" } },
      { personName:     { contains: search, mode: "insensitive" } },
      { fromOffice:     { contains: search, mode: "insensitive" } },
      { toOffice:       { contains: search, mode: "insensitive" } },
      { subject:        { contains: search, mode: "insensitive" } },
      { trackingCode:   { contains: search, mode: "insensitive" } },
    ];
  }
  if (dateFrom || dateTo) {
    where.documentDate = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo   && { lte: new Date(new Date(dateTo).setHours(23, 59, 59)) }),
    };
  }

  const [records, total] = await Promise.all([
    prisma.record.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: "desc" },
      select: { ...recordSelect },
    }),
    prisma.record.count({ where }),
  ]);

  return { records, total };
};

// ── Get single ────────────────────────────────────────────────────────────────
const getSingleRecord = async (id: string) => {
  const record = await prisma.record.findFirst({
    where:   { id, isDeleted: false },
    include: {
      processedBy: { select: { id: true, name: true, username: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true, content: true, authorName: true,
          createdAt: true, updatedAt: true,
          author: { select: { id: true, name: true, username: true } },
        },
      },
    },
  });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Record not found");
  return record;
};

// ── Public tracking (no auth) ─────────────────────────────────────────────────
const getRecordByTrackingCode = async (trackingCode: string) => {
  const record = await prisma.record.findFirst({
    where: { trackingCode, isDeleted: false },
    select: {
      trackingCode: true, type: true, status: true,
      documentTitle: true, documentNumber: true,
      category: true, subject: true,
      fromOffice: true, toOffice: true,
      personName: true,
      documentDate: true, receivedAt: true, releasedAt: true,
      actionTaken: true, remarks: true,
      createdAt: true, updatedAt: true,
      // ⚠ No signatures, no personal email — safe for public
    },
  });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Record not found. Please check your tracking code.");
  return record;
};

// ── Update ────────────────────────────────────────────────────────────────────
const updateRecord = async (id: string, data: UpdateRecordInput, adminId?: string) => {
  const record = await prisma.record.findFirst({ where: { id, isDeleted: false } });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Record not found");
  if (record.status === "RELEASED") throw new AppError(StatusCodes.BAD_REQUEST, "Cannot edit a released record");

  const updated = await prisma.record.update({
    where: { id },
    data: {
      ...(data.documentTitle    && { documentTitle:    data.documentTitle }),
      ...(data.documentNumber   && { documentNumber:   data.documentNumber }),
      ...(data.particulars      && { particulars:      data.particulars }),
      ...(data.category         && { category:         data.category }),
      ...(data.fromOffice       && { fromOffice:       data.fromOffice }),
      ...(data.toOffice         && { toOffice:         data.toOffice }),
      ...(data.subject          && { subject:          data.subject }),
      ...(data.personName       && { personName:       data.personName }),
      ...(data.personEmail      && { personEmail:      data.personEmail }),
      ...(data.personDepartment && { personDepartment: data.personDepartment }),
      ...(data.personPosition   && { personPosition:   data.personPosition }),
      ...(data.documentDate     && { documentDate:     new Date(data.documentDate) }),
      ...(data.remarks          && { remarks:          data.remarks }),
      ...(data.actionTaken      && { actionTaken:      data.actionTaken }),
    },
    select: { id: true, type: true, status: true, documentTitle: true, personName: true, updatedAt: true },
  });

  if (adminId) {
    const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, username: true } });
    await activityLogService.createLog({
      action: "UPDATED", entityType: "Record",
      entityId: updated.id, entityName: updated.documentTitle,
      details: `Updated record — "${updated.documentTitle}"`,
      adminId, adminName: admin?.name || admin?.username,
    });
  }

  return updated;
};

// ── Receive ───────────────────────────────────────────────────────────────────
const receiveRecord = async (id: string, data: ReceiveRecordInput, adminId: string) => {
  const record = await prisma.record.findFirst({ where: { id, isDeleted: false } });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Record not found");
  if (record.status !== "PENDING") throw new AppError(StatusCodes.BAD_REQUEST, "Record is not pending");

  const updated = await prisma.record.update({
    where: { id },
    data: {
      status: "RECEIVED", receivedAt: new Date(),
      actionTaken: data.actionTaken ?? "",
      remarks: data.remarks ?? "",
      receiverSignature: data.receiverSignature,
    },
    select: {
      id: true, type: true, status: true, documentTitle: true, personName: true,
      receivedAt: true, receiverSignature: true,
      processedBy: { select: { id: true, name: true, username: true } },
    },
  });

  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, username: true } });
  await activityLogService.createLog({
    action: "UPDATED", entityType: "Record",
    entityId: updated.id, entityName: updated.documentTitle,
    details: `Received record — "${updated.documentTitle}"`,
    adminId, adminName: admin?.name || admin?.username,
  });

  return updated;
};

// ── Release ───────────────────────────────────────────────────────────────────
const releaseRecord = async (id: string, data: ReleaseRecordInput, adminId: string) => {
  const record = await prisma.record.findFirst({ where: { id, isDeleted: false } });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Record not found");
  if (record.status === "RELEASED") throw new AppError(StatusCodes.BAD_REQUEST, "Record already released");

  const updated = await prisma.record.update({
    where: { id },
    data: {
      status: "RELEASED", releasedAt: new Date(),
      actionTaken: data.actionTaken ?? "",
      remarks: data.remarks ?? "",
      receiverSignature: data.receiverSignature,
    },
    select: {
      id: true, type: true, status: true, documentTitle: true, personName: true,
      releasedAt: true, receiverSignature: true,
      processedBy: { select: { id: true, name: true, username: true } },
    },
  });

  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, username: true } });
  await activityLogService.createLog({
    action: "UPDATED", entityType: "Record",
    entityId: updated.id, entityName: updated.documentTitle,
    details: `Released record — "${updated.documentTitle}"`,
    adminId, adminName: admin?.name || admin?.username,
  });

  return updated;
};

// ── Bulk receive ──────────────────────────────────────────────────────────────
const bulkReceive = async (data: BulkReceiveInput, adminId: string) => {
  const eligible = await prisma.record.findMany({
    where: { id: { in: data.ids }, isDeleted: false, status: "PENDING" },
    select: { id: true },
  });
  const eligibleIds = eligible.map(r => r.id);
  if (eligibleIds.length === 0)
    throw new AppError(StatusCodes.BAD_REQUEST, "No pending records found to receive");

  await prisma.record.updateMany({
    where: { id: { in: eligibleIds } },
    data: {
      status: "RECEIVED", receivedAt: new Date(),
      actionTaken: data.actionTaken ?? "",
      remarks: data.remarks ?? "",
      receiverSignature: data.receiverSignature,
    },
  });

  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, username: true } });
  await activityLogService.createLog({
    action: "BULK_RECEIVED", entityType: "Record",
    entityName: `${eligibleIds.length} records`,
    details: `Bulk received ${eligibleIds.length} record(s)`,
    adminId, adminName: admin?.name || admin?.username,
  });

  return { received: eligibleIds.length, skipped: data.ids.length - eligibleIds.length };
};

// ── Bulk release ──────────────────────────────────────────────────────────────
const bulkRelease = async (data: BulkReleaseInput, adminId: string) => {
  const eligible = await prisma.record.findMany({
    where: { id: { in: data.ids }, isDeleted: false, status: "RECEIVED" },
    select: { id: true },
  });
  const eligibleIds = eligible.map(r => r.id);
  if (eligibleIds.length === 0)
    throw new AppError(StatusCodes.BAD_REQUEST, "No received records found to release");

  await prisma.record.updateMany({
    where: { id: { in: eligibleIds } },
    data: {
      status: "RELEASED", releasedAt: new Date(),
      actionTaken: data.actionTaken ?? "",
      remarks: data.remarks ?? "",
      receiverSignature: data.receiverSignature,
    },
  });

  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, username: true } });
  await activityLogService.createLog({
    action: "BULK_RELEASED", entityType: "Record",
    entityName: `${eligibleIds.length} records`,
    details: `Bulk released ${eligibleIds.length} record(s)`,
    adminId, adminName: admin?.name || admin?.username,
  });

  return { released: eligibleIds.length, skipped: data.ids.length - eligibleIds.length };
};

// ── Comments ──────────────────────────────────────────────────────────────────
const getComments = async (recordId: string) => {
  const record = await prisma.record.findFirst({ where: { id: recordId, isDeleted: false }, select: { id: true } });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Record not found");

  return prisma.recordComment.findMany({
    where: { recordId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, content: true, authorName: true, createdAt: true, updatedAt: true,
      author: { select: { id: true, name: true, username: true } },
    },
  });
};

const createComment = async (recordId: string, data: CreateCommentInput, adminId: string) => {
  const record = await prisma.record.findFirst({ where: { id: recordId, isDeleted: false }, select: { id: true } });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Record not found");

  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, username: true } });

  return prisma.recordComment.create({
    data: {
      content:    data.content,
      recordId,
      authorId:   adminId,
      authorName: admin?.name || admin?.username || "Admin",
    },
    select: {
      id: true, content: true, authorName: true, createdAt: true, updatedAt: true,
      author: { select: { id: true, name: true, username: true } },
    },
  });
};

const deleteComment = async (commentId: string, adminId: string) => {
  const comment = await prisma.recordComment.findFirst({ where: { id: commentId } });
  if (!comment) throw new AppError(StatusCodes.NOT_FOUND, "Comment not found");
  if (comment.authorId !== adminId)
    throw new AppError(StatusCodes.FORBIDDEN, "You can only delete your own comments");

  return prisma.recordComment.delete({ where: { id: commentId } });
};

// ── Delete / Archive ──────────────────────────────────────────────────────────
const deleteRecord = async (id: string, adminId: string) => {
  const record = await prisma.record.findFirst({
    where: { id, isDeleted: false }, select: { id: true, documentTitle: true },
  });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Record not found");

  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, username: true } });
  await activityLogService.createLog({
    action: "DELETED", entityType: "Record",
    entityId: record.id, entityName: record.documentTitle,
    details: `Deleted record — "${record.documentTitle}"`,
    adminId, adminName: admin?.name || admin?.username,
  });

  return prisma.record.update({
    where: { id },
    data:  { isDeleted: true, deletedAt: new Date() },
    select: { id: true, isDeleted: true },
  });
};

const archiveRecord = async (id: string, adminId: string) => {
  const record = await prisma.record.findFirst({
    where: { id, isDeleted: false, isArchived: false }, select: { id: true, documentTitle: true },
  });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Record not found or already archived");

  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, username: true } });
  await activityLogService.createLog({
    action: "ARCHIVED", entityType: "Record",
    entityId: record.id, entityName: record.documentTitle,
    details: `Archived record — "${record.documentTitle}"`,
    adminId, adminName: admin?.name || admin?.username,
  });

  return prisma.record.update({
    where: { id }, data: { isArchived: true, archivedAt: new Date() },
    select: { id: true, isArchived: true },
  });
};

const unarchiveRecord = async (id: string, adminId: string) => {
  const record = await prisma.record.findFirst({
    where: { id, isDeleted: false, isArchived: true }, select: { id: true, documentTitle: true },
  });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Record not found or not archived");

  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, username: true } });
  await activityLogService.createLog({
    action: "UNARCHIVED", entityType: "Record",
    entityId: record.id, entityName: record.documentTitle,
    details: `Unarchived record — "${record.documentTitle}"`,
    adminId, adminName: admin?.name || admin?.username,
  });

  return prisma.record.update({
    where: { id }, data: { isArchived: false, archivedAt: null },
    select: { id: true, isArchived: true },
  });
};

const bulkCreate = async (records: CreateRecordInput[], adminId: string) => {
  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, username: true } });

  const created = await prisma.$transaction(
    records.map(data => prisma.record.create({
      data: {
        type: data.type, documentTitle: data.documentTitle,
        documentNumber: data.documentNumber ?? "",
        particulars: data.particulars ?? "", category: data.category ?? "",
        fromOffice: data.fromOffice ?? "", toOffice: data.toOffice ?? "",
        subject: data.subject ?? "", personName: data.personName,
        personEmail: data.personEmail ?? "", personDepartment: data.personDepartment ?? "",
        personPosition: data.personPosition ?? "",
        documentDate: new Date(data.documentDate),
        remarks: data.remarks ?? "",
        submitterSignature: data.submitterSignature,
        processedById: adminId, status: "PENDING",
      },
    }))
  );

  await activityLogService.createLog({
    action: "BULK_CREATED", entityType: "Record",
    entityName: `${created.length} records`,
    details: `Bulk imported ${created.length} record(s)`,
    adminId, adminName: admin?.name || admin?.username,
  });

  return created;
};

const bulkDelete = async (ids: string[], adminId: string) => {
  const eligible = await prisma.record.findMany({
    where: { id: { in: ids }, isDeleted: false }, select: { id: true },
  });
  const eligibleIds = eligible.map(r => r.id);
  if (eligibleIds.length === 0) throw new AppError(StatusCodes.BAD_REQUEST, "No records found to delete");

  await prisma.record.updateMany({
    where: { id: { in: eligibleIds } },
    data:  { isDeleted: true, deletedAt: new Date() },
  });

  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, username: true } });
  await activityLogService.createLog({
    action: "BULK_DELETED", entityType: "Record",
    entityName: `${eligibleIds.length} records`,
    details: `Bulk deleted ${eligibleIds.length} record(s)`,
    adminId, adminName: admin?.name || admin?.username,
  });

  return { deleted: eligibleIds.length };
};

const getStats = async () => {
  const [total, incoming, outgoing, pending, received, released, archived] = await Promise.all([
    prisma.record.count({ where: { isDeleted: false, isArchived: false } }),
    prisma.record.count({ where: { isDeleted: false, isArchived: false, type: "INCOMING" } }),
    prisma.record.count({ where: { isDeleted: false, isArchived: false, type: "OUTGOING" } }),
    prisma.record.count({ where: { isDeleted: false, isArchived: false, status: "PENDING" } }),
    prisma.record.count({ where: { isDeleted: false, isArchived: false, status: "RECEIVED" } }),
    prisma.record.count({ where: { isDeleted: false, isArchived: false, status: "RELEASED" } }),
    prisma.record.count({ where: { isDeleted: false, isArchived: true } }),
  ]);

  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const [todayCount, weekCount, recentRecords] = await Promise.all([
    prisma.record.count({ where: { isDeleted: false, isArchived: false, createdAt: { gte: today } } }),
    prisma.record.count({ where: { isDeleted: false, isArchived: false, createdAt: { gte: weekStart } } }),
    prisma.record.findMany({
      where: { isDeleted: false, isArchived: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, type: true, status: true, documentTitle: true, personName: true, createdAt: true },
    }),
  ]);

  return { total, incoming, outgoing, pending, received, released, archived, todayCount, weekCount, recentRecords };
};

export const recordsService = {
  createRecord, getRecords, getSingleRecord, getRecordByTrackingCode,
  updateRecord, receiveRecord, releaseRecord,
  bulkReceive, bulkRelease,
  getComments, createComment, deleteComment,
  deleteRecord, bulkDelete, archiveRecord, unarchiveRecord,
  bulkCreate, getStats,
};