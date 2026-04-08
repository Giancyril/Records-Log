import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { templatesService } from "./templates.service";
import { createTemplateSchema, updateTemplateSchema } from "./templates.validate";

const getTemplates = async (_req: Request, res: Response) => {
  try {
    const result = await templatesService.getTemplates();
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Templates retrieved", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: 400, success: false, message: err.message, data: null });
  }
};

const createTemplate = async (req: Request, res: Response) => {
  try {
    const data   = createTemplateSchema.parse(req.body);
    const result = await templatesService.createTemplate(data, req.user!.id);
    sendResponse(res, { res, statusCode: StatusCodes.CREATED, success: true, message: "Template created", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const updateTemplate = async (req: Request, res: Response) => {
  try {
    const data   = updateTemplateSchema.parse(req.body);
    const result = await templatesService.updateTemplate(req.params.id, data);
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Template updated", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const deleteTemplate = async (req: Request, res: Response) => {
  try {
    await templatesService.deleteTemplate(req.params.id);
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Template deleted", data: null });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

export const templatesController = { getTemplates, createTemplate, updateTemplate, deleteTemplate };