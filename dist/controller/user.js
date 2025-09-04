"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getUserProfile = exports.deleteUser = exports.getUserById = exports.getAllUser = exports.userLogout = exports.userLogin = exports.userRegister = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const fs_1 = __importDefault(require("fs"));
const cloudinary_1 = require("../utils/cloudinary");
const user_1 = require("../model/user");
const token_1 = __importDefault(require("../utils/token"));
const user_2 = require("../validators/user");
exports.userRegister = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // const {name, email, password, role} = req.body
    // let profileImageUrl = ''
    // console.log(profileImageUrl);
    console.log(req.files);
    const { name, email, password } = req.body;
    let profileImageUrl = null;
    const files = req.files;
    const profileImageUrl_path = (_a = files.profileImageUrl) === null || _a === void 0 ? void 0 : _a[0].path;
    try {
        if (profileImageUrl_path) {
            try {
                profileImageUrl = yield (0, cloudinary_1.uploadToCloudinary)(profileImageUrl_path);
            }
            catch (error) {
                console.log(error);
                fs_1.default.unlinkSync(profileImageUrl_path);
            }
        }
        const existingUser = yield user_1.User.findOne({ email });
        if (existingUser) {
            res.status(400);
            throw new Error("Email is already existed");
        }
        const user = yield user_1.User.create({
            name,
            email,
            password,
            profileImageUrl
        });
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImageUrl: user.profileImageUrl
            });
        }
    }
    catch (error) {
        console.log("Error at registeration");
        fs_1.default.unlinkSync(profileImageUrl_path);
        next(error);
    }
}));
exports.userLogin = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const existingUser = yield user_1.User.findOne({ email });
    if (existingUser && (yield existingUser.matchPassword(password))) {
        (0, token_1.default)(res, existingUser._id);
        res.status(200).json({
            _id: existingUser._id,
            email: existingUser.email,
            password: existingUser.password,
            role: existingUser.role,
            profileImageUrl: existingUser.profileImageUrl
        });
    }
    else {
        res.status(401);
        throw new Error("Invalid Credentials");
    }
}));
exports.userLogout = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.cookie("token", {
        httpOnly: true,
        expires: new Date()
    });
    res.status(200).json({ message: `Logout successfully` });
}));
exports.getAllUser = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, search, searchBy } = user_2.getUserListParamSchema.parse(req.query);
    const filter = {};
    if (search && searchBy == 'name') {
        filter.name = { $regex: search, $options: "i" };
    }
    const skip = (page - 1) * limit;
    const users = yield user_1.User.find(filter).skip(skip).limit(limit).select("-password");
    if (!users || users.length === 0) {
        res.status(404);
        throw new Error("No User Found");
    }
    res.status(200).json({
        message: "Users are fetched successfully",
        users,
        pagination: {
            page,
            limit,
            count: users.length
        }
    });
}));
exports.getUserById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const loggedInUser = req.user;
    const { id } = req.params;
    const user = yield user_1.User.findById(id).select("-password");
    if (!user) {
        res.status(404);
        throw new Error("No User Found");
    }
    const isAdmin = (loggedInUser === null || loggedInUser === void 0 ? void 0 : loggedInUser.role) === "admin";
    const isSelf = (loggedInUser === null || loggedInUser === void 0 ? void 0 : loggedInUser._id.toString()) === id;
    if (isAdmin || isSelf) {
        res.status(200).json(user);
        return;
    }
    res.status(200).json({
        name: user.name,
        profileImageUrl: user.profileImageUrl,
    });
    return;
}));
exports.deleteUser = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const user = yield user_1.User.findById(id).select("-password");
    if (!user) {
        res.status(404);
        throw new Error("No User Found");
    }
    if ((user === null || user === void 0 ? void 0 : user.role) === "admin") {
        res.status(403);
        throw new Error("Permission Denied, Can't delete Admin");
    }
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === "admin";
    const isOwner = user._id.equals(userId);
    if (!isAdmin && !isOwner) {
        res.status(403);
        throw new Error("You are not authorized to delete this user");
    }
    yield user_1.User.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted successfully" });
}));
exports.getUserProfile = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized: No user ID found in request");
    }
    const existed = yield user_1.User.findById(userId).select("-password");
    if (!existed) {
        res.status(404);
        throw new Error("No User Found");
    }
    res.status(200).json(existed);
}));
exports.updateProfile = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const existingUser = yield user_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
    if (!existingUser) {
        res.status(404);
        throw new Error("No User Found");
    }
    existingUser.name = req.body.name || existingUser.name;
    existingUser.email = req.body.email || existingUser.email;
    existingUser.password = req.body.password || existingUser.password;
    if ((_b = req.file) === null || _b === void 0 ? void 0 : _b.path) {
        try {
            const cloudinaryUrl = yield (0, cloudinary_1.uploadToCloudinary)(req.file.path);
            if (cloudinaryUrl !== null) {
                existingUser.profileImageUrl = cloudinaryUrl;
            }
            console.log("File path:", (_c = req.file) === null || _c === void 0 ? void 0 : _c.path);
            if (fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
        }
        catch (error) {
            console.log(error);
            if (((_d = req.file) === null || _d === void 0 ? void 0 : _d.path) && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
        }
    }
    const updatedUser = yield existingUser.save();
    const selectedUser = {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImageUrl: updatedUser.profileImageUrl
    };
    res.status(200).json(selectedUser);
}));
