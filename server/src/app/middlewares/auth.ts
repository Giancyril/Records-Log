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
  try {
    const token = req.headers["authorization"];
    if (!token) {
      res.status(401).json({ success: false, message: "Unauthorized — no token" });
      return;
    }
    const decoded = utils.verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Unauthorized — invalid token" });
  }
};

export default auth;