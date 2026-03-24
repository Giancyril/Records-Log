import { Response } from "express";

interface SendResponseParams {
  res:        Response;
  statusCode: number;
  success:    boolean;
  message:    string;
  data?:      any;
  meta?:      any;
}

const sendResponse = (res: Response, { statusCode, success, message, data, meta }: SendResponseParams) => {
  res.status(statusCode).json({ success, statusCode, message, meta, data });
};

export default sendResponse;