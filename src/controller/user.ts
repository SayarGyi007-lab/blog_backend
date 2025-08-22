import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import fs from 'fs'
import { uploadToCloudinary } from "../utils/cloudinary";
import { User } from "../model/user";
import generateToken from "../utils/token";
import { getUserListParamSchema } from "../validators/user";
import { AuthRequest } from "../middlewares/protect";


export const userRegister = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // const {name, email, password, role} = req.body
    // let profileImageUrl = ''
    // console.log(profileImageUrl);
    console.log(req.files)

    const { name, email, password } = req.body
    let profileImageUrl: string | null = null
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const profileImageUrl_path = files.profileImageUrl?.[0].path

    try {
        if (profileImageUrl_path) {
            try {
                profileImageUrl = await uploadToCloudinary(profileImageUrl_path)
            } catch (error) {
                console.log(error);
                fs.unlinkSync(profileImageUrl_path)
            }
        }

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            res.status(400)
            throw new Error("Email is already existed")
        }

        const user = await User.create({
            name,
            email,
            password,
            profileImageUrl
        })

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImageUrl: user.profileImageUrl
            })
        }

    } catch (error) {
        console.log("Error at registeration");
        fs.unlinkSync(profileImageUrl_path)
        next(error)
    }
})

export const userLogin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body
    const existingUser = await User.findOne({ email })
    if (existingUser && (await existingUser.matchPassword(password))) {
        generateToken(res, existingUser._id)
        res.status(200).json({
            _id: existingUser._id,
            email: existingUser.email,
            password: existingUser.password,
            role: existingUser.role,
            profileImageUrl: existingUser.profileImageUrl
        })
    } else {
        res.status(401)
        throw new Error("Invalid Credentials")
    }
})

export const userLogout = asyncHandler(async (req: Request, res: Response) => {

    res.cookie("token", {
        httpOnly: true,
        expires: new Date()
    })
    res.status(200).json({ message: `Logout successfully` })
})

export const getAllUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10, search, searchBy } = getUserListParamSchema.parse(req.query)

    const filter: Record<string, any> = {}

    if (search && searchBy == 'name') {
        filter.name = { $regex: search, $options: "i" }
    }

    const skip = (page - 1) * limit

    const users = await User.find(filter).skip(skip).limit(limit).select("-password")

    if (!users || users.length === 0) {
        res.status(404)
        throw new Error("No User Found")
    }
    res.status(200).json({
        message: "Users are fetched successfully",
        users,
        pagination: {
            page,
            limit,
            count: users.length
        }
    })
})

export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const loggedInUser = req.user;
    const { id } = req.params
    const user = await User.findById(id).select("-password")
    if (!user) {
        res.status(404)
        throw new Error("No User Found")
    }
    const isAdmin = loggedInUser?.role === "admin";
    const isSelf = loggedInUser?._id.toString() === id;

    if (isAdmin || isSelf) {
        res.status(200).json(user);
        return;  
    }

    res.status(200).json({
        name: user.name,
        profileImageUrl: user.profileImageUrl,
    });
    return;
})

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const user = await User.findById(id).select("-password");
    if (!user) {
        res.status(404)
        throw new Error("No User Found")
    }
    if (user?.role === "admin") {
        res.status(403)
        throw new Error("Permission Denied, Can't delete Admin")
    }
    const userId = req.user?._id;
    const isAdmin = req.user?.role === "admin";
    const isOwner = user._id.equals(userId);

    if (!isAdmin && !isOwner) {
        res.status(403);
        throw new Error("You are not authorized to delete this user");
    }

    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted successfully" })
})

export const getUserProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id

    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized: No user ID found in request");
    }

    const existed = await User.findById(userId).select("-password")
    if (!existed) {
        res.status(404)
        throw new Error("No User Found")
    }
    res.status(200).json(existed)

})

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const existingUser = await User.findById(req.user?._id)
    if (!existingUser) {
        res.status(404)
        throw new Error("No User Found")
    }

    existingUser.name = req.body.name || existingUser.name
    existingUser.email = req.body.email || existingUser.email
    existingUser.password = req.body.password || existingUser.password

    if (req.file?.path) {
        try {
            const cloudinaryUrl = await uploadToCloudinary(req.file.path);
            if (cloudinaryUrl !== null) {
                existingUser.profileImageUrl = cloudinaryUrl;
            }
            console.log("File path:", req.file?.path);

            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        } catch (error) {
            console.log(error);
            if (req.file?.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }
    }

    const updatedUser = await existingUser.save()

    const selectedUser = {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImageUrl: updatedUser.profileImageUrl
    }

    res.status(200).json(selectedUser)
})