import { NextFunction, Response } from "express";
import { AuthRequest } from "./protect";

const validateImageCount = (req: AuthRequest, res: Response, next: NextFunction) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const imageFiles = files.postImageUrl;

  if (!imageFiles || imageFiles.length < 3) {
    return res.status(400).json({ message: "At least 3 photos are required." });
  }

  if (imageFiles.length > 10) {
    return res.status(400).json({ message: "No more than 10 photos are allowed." });
  }

  next();
};

export { validateImageCount };
