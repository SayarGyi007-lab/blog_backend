import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import jwt, { JwtPayload } from "jsonwebtoken"
import { Types } from "mongoose";
import { User } from "../model/user";

export interface AuthRequest extends Request{
    user?:{
        name: string,
        email: string,
        role?: string,
        _id: string | Types.ObjectId
    }
}

interface User{
    name: string,
    email: string,
    _id: string | Types.ObjectId
}

const protect = asyncHandler(async(req: AuthRequest, res: Response, next: NextFunction)=>{
    let token;
    console.log("Cookies received:", req.cookies);


    token = req.cookies.token

    if(!token){
        res.status(401)
        throw new Error("Unauthorized")
    }

    try {
        const decoded =  jwt.verify(token, process.env.JWT_SECRET_KEY!) as JwtPayload
        if(!decoded){
            res.status(401)
            throw new Error("Unauthorized, Invalid token")
        }
        console.log("Token received:", token);
        console.log("Decoded JWT:", decoded);

        req.user = await User.findById(decoded.userId) as User
        next()
    } catch (error) {
        res.status(401)
        throw new Error("Unauthorized, Invalid token")
    }
})

export {protect}