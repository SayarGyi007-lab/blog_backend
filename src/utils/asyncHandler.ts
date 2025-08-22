import { NextFunction, Request, Response } from "express";

export const asyncHandler = (
    Controlfn: (req: Request, res: Response, next: NextFunction)
        => Promise<void>
) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(Controlfn(req, res, next)).catch(next)
}