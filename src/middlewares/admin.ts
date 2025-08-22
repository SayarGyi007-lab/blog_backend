import { NextFunction, Response } from "express";
import { AuthRequest } from "./protect";

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log('req.user:', req.user);
    if (req.user?.role !== 'admin') {
      res.status(403);
      throw new Error('Admin access required');
    }
    next();
  };
  