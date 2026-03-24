import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { authService } from "./auth.service";
import { activityLogService } from "../activityLog/activityLog.service";
import { loginSchema, registerSchema, changePasswordSchema, changeEmailSchema, changeUsernameSchema } from "./auth.validate";

const login = async (req: Request, res: Response) => {
  try {
    const data   = loginSchema.parse(req.body);
    const result = await authService.login(data);
    await activityLogService.createLog({ action: "LOGIN", entityType: "User", entityName: data.email, details: "Admin logged in", adminName: data.email });
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Login successful", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const register = async (req: Request, res: Response) => {
  try {
    const data   = registerSchema.parse(req.body);
    const result = await authService.register(data);
    await activityLogService.createLog({ action: "REGISTERED", entityType: "User", entityName: data.email, details: `Registered admin "${data.name}"`, adminName: req.user?.name });
    sendResponse(res, { res, statusCode: StatusCodes.CREATED, success: true, message: "Admin registered", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const getAdmins = async (_req: Request, res: Response) => {
  try {
    const result = await authService.getAdmins();
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Admins retrieved", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: 400, success: false, message: err.message, data: null });
  }
};

const deleteAdmin = async (req: Request, res: Response) => {
  try {
    await authService.deleteAdmin(req.params.id, req.user!.id);
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Admin deleted", data: null });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const changePassword = async (req: Request, res: Response) => {
  try {
    const data = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.id, data);
    await activityLogService.createLog({ action: "CHANGED_PASSWORD", entityType: "User", adminId: req.user!.id, adminName: req.user!.name, details: "Password changed" });
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Password changed", data: null });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const changeEmail = async (req: Request, res: Response) => {
  try {
    const data   = changeEmailSchema.parse(req.body);
    const result = await authService.changeEmail(req.user!.id, data);
    await activityLogService.createLog({ action: "CHANGED_EMAIL", entityType: "User", adminId: req.user!.id, adminName: req.user!.name, details: `Email changed to ${data.email}` });
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Email updated", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const changeUsername = async (req: Request, res: Response) => {
  try {
    const data   = changeUsernameSchema.parse(req.body);
    const result = await authService.changeUsername(req.user!.id, data);
    await activityLogService.createLog({ action: "CHANGED_USERNAME", entityType: "User", adminId: req.user!.id, adminName: req.user!.name, details: `Username changed to ${data.username}` });
    sendResponse(res, { res, statusCode: StatusCodes.OK, success: true, message: "Username updated", data: result });
  } catch (err: any) {
    sendResponse(res, { res, statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

export const authController = { login, register, getAdmins, deleteAdmin, changePassword, changeEmail, changeUsername };