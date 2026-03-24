import { Request, Response, NextFunction } from "express";

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success:    false,
    statusCode,
    message:    err.message || "Internal server error",
    data:       null,
  });
};

export default errorHandler;