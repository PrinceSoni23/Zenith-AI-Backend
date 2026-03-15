import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createError } from "./errorHandler";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: "student" | "parent" | "admin";
    email: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(createError("Authentication required", 401));
  }

  try {
    const secret =
      process.env.JWT_SECRET || "fallback_secret_change_in_production";
    const decoded = jwt.verify(token, secret) as AuthRequest["user"];
    req.user = decoded;
    next();
  } catch {
    next(createError("Invalid or expired token", 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        createError("Access forbidden: insufficient permissions", 403),
      );
    }
    next();
  };
};
