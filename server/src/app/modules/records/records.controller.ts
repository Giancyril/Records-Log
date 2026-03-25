import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { recordsService } from "./records.service";
import { utils } from "../../utils/utils";
import {
  createRecordSchema, updateRecordSchema,
  receiveRecordSchema, releaseRecordSchema,
  CreateRecordInput,
} from "./records.validate";

const createRecord = async (req: Request, res: Response) => {
  try {
    const data   = createRecordSchema.parse(req.body);
    const result = await recordsService.createRecord(data, req.user!.id);
    sendResponse(res, { res, statusCode: StatusCodes.CREATED, success: true, message: "Record created", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const getRecords = async (req: Request, res: Response) => {
  try {
    const { records, total } = await recordsService.getRecords(req.query);
    const meta = utils.calculateMeta(req.query, total);
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Records retrieved", meta, data: records });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: 400, success: false, message: err.message, data: null });
  }
};

const getSingleRecord = async (req: Request, res: Response) => {
  try {
    const result = await recordsService.getSingleRecord(req.params.id);
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Record retrieved", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const updateRecord = async (req: Request, res: Response) => {
  try {
    const data   = updateRecordSchema.parse(req.body);
    const result = await recordsService.updateRecord(req.params.id, data, req.user!.id);
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Record updated", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const receiveRecord = async (req: Request, res: Response) => {
  try {
    const data   = receiveRecordSchema.parse(req.body);
    const result = await recordsService.receiveRecord(req.params.id, data, req.user!.id);
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Record marked as received", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const releaseRecord = async (req: Request, res: Response) => {
  try {
    const data   = releaseRecordSchema.parse(req.body);
    const result = await recordsService.releaseRecord(req.params.id, data, req.user!.id);
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Record marked as released", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const deleteRecord = async (req: Request, res: Response) => {
  try {
    await recordsService.deleteRecord(req.params.id, req.user!.id);
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Record deleted", data: null });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const bulkDelete = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0)
      return sendResponse(res, { res, statusCode: 400, success: false, message: "No record IDs provided", data: null });
    const result = await recordsService.bulkDelete(ids, req.user!.id);
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: `${result.deleted} record(s) deleted`, data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const archiveRecord = async (req: Request, res: Response) => {
  try {
    const result = await recordsService.archiveRecord(req.params.id, req.user!.id);
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Record archived", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const unarchiveRecord = async (req: Request, res: Response) => {
  try {
    const result = await recordsService.unarchiveRecord(req.params.id, req.user!.id);
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Record unarchived", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const bulkCreate = async (req: Request, res: Response) => {
  try {
    const records = req.body as CreateRecordInput[];
    if (!Array.isArray(records) || records.length === 0)
      return sendResponse(res, { res, statusCode: 400, success: false, message: "No records provided", data: null });
    
    // Validate each record
    const validated = records.map(r => createRecordSchema.parse(r));
    const result = await recordsService.bulkCreate(validated, req.user!.id);
    sendResponse(res, { res, statusCode: StatusCodes.CREATED, success: true, message: `${result.length} record(s) imported`, data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: 400, success: false, message: err.message, data: null });
  }
};

const getStats = async (_req: Request, res: Response) => {
  try {
    const result = await recordsService.getStats();
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Stats retrieved", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: 400, success: false, message: err.message, data: null });
  }
};

export const recordsController = {
  createRecord, getRecords, getSingleRecord,
  updateRecord, receiveRecord, releaseRecord,
  deleteRecord, bulkDelete, archiveRecord, unarchiveRecord,
  bulkCreate, getStats,
};