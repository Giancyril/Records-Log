import { StatusCodes } from "http-status-codes";

class AppError extends Error {
  statusCode: number;
  constructor(statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export default AppError;