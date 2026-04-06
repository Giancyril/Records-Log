import { Request, Response, NextFunction } from "express";
import { utils } from "../utils/utils";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const auth = (req: Request, res: Response, next: NextFunction) => {
  // Bypassing authentication for "no-login" mode
  req.user = {
    id: "00000000-0000-0000-0000-000000000000",
    email: "admin@nbsc.edu.ph",
    username: "admin",
    name: "System Admin",
    role: "ADMIN",
  };
  next();
};

export default auth;