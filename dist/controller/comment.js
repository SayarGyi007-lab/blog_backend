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
exports.replyCommentController = exports.toggleLikeComment = exports.updateComment = exports.getAllComments = exports.deleteComment = exports.addComment = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const post_1 = require("../model/post");
const comment_1 = require("../model/comment");
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const cloudinary_1 = require("../utils/cloudinary");
exports.addComment = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const { content } = req.body;
    let commentImageUrl = null;
    const files = req.files;
    const commentImageUrl_path = (_a = files.commentImageUrl) === null || _a === void 0 ? void 0 : _a[0].path;
    try {
        if (commentImageUrl_path) {
            try {
                commentImageUrl = yield (0, cloudinary_1.uploadToCloudinary)(commentImageUrl_path);
            }
            catch (error) {
                console.log(error);
                fs_1.default.unlinkSync(commentImageUrl_path);
            }
        }
        if (!content) {
            res.status(400);
            throw new Error("Content is required");
        }
        const post = yield post_1.Post.findById(id);
        if (!post) {
            res.status(404);
            throw new Error("No post found");
        }
        const newComment = new comment_1.Comment({
            comment_author: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
            post: id,
            content,
            commentImageUrl
        });
        yield newComment.save();
        res.status(200).json(newComment);
    }
    catch (error) {
        console.log("Error at registeration");
        fs_1.default.unlinkSync(commentImageUrl_path);
        next(error);
    }
}));
exports.deleteComment = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id: postId, commentId } = req.params;
    const comment = yield comment_1.Comment.findById(commentId);
    if (!comment) {
        res.status(404);
        throw new Error("No comment found");
    }
    if (comment.post.toString() !== postId) {
        res.status(400);
        throw new Error("Comment does not belong to the specified post");
    }
    const isOwner = comment.comment_author._id.toString() == ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString());
    const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) == "admin";
    if (!isOwner && !isAdmin) {
        res.status(403);
        throw new Error("Not authorized to delete comment");
    }
    yield comment.deleteOne();
    res.status(200).json({ message: "Comment is successfully deleted" });
}));
exports.getAllComments = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const allComments = yield comment_1.Comment.find({ post: id })
        .populate("comment_author", "name email")
        .sort({ createdAt: -1 })
        .lean();
    const commentMap = new Map();
    allComments.forEach(comment => {
        comment.replies = [];
        commentMap.set(comment._id.toString(), comment);
    });
    const rootComments = [];
    allComments.forEach(comment => {
        if (comment.parentComment) {
            const parent = commentMap.get(comment.parentComment.toString());
            if (parent) {
                parent.replies.push(comment);
            }
        }
        else {
            rootComments.push(comment);
        }
    });
    res.status(200).json(rootComments);
}));
exports.updateComment = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { id: postId, commentId } = req.params;
    const { content } = req.body;
    const comment = yield comment_1.Comment.findById(commentId);
    if (!comment) {
        res.status(404);
        throw new Error("No comment found");
    }
    if (comment.post.toString() !== postId) {
        res.status(400);
        throw new Error("Comment does not belong to the specified post");
    }
    const isOwner = comment.comment_author._id.toString() == ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString());
    const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) == "admin";
    if (!isOwner && !isAdmin) {
        res.status(403);
        throw new Error("Not authorized to delete comment");
    }
    comment.content = content || comment.content;
    if ((_c = req.file) === null || _c === void 0 ? void 0 : _c.path) {
        try {
            const cloudinaryUrl = yield (0, cloudinary_1.uploadToCloudinary)(req.file.path);
            if (cloudinaryUrl !== null) {
                comment.commentImageUrl = cloudinaryUrl;
            }
            console.log("File path:", (_d = req.file) === null || _d === void 0 ? void 0 : _d.path);
            if (fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
        }
        catch (error) {
            console.log(error);
            if (((_e = req.file) === null || _e === void 0 ? void 0 : _e.path) && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
        }
    }
    const updatedComment = yield comment.save();
    res.status(200).json(updatedComment);
}));
exports.toggleLikeComment = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { commentId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString();
    const comment = yield comment_1.Comment.findById(commentId);
    if (!comment) {
        res.status(404);
        throw new Error("No comment found");
    }
    const alreadyLiked = comment.likes.some((id) => id.toString() == userId);
    if (alreadyLiked) {
        comment.likes = comment.likes.filter((id) => id.toString() != userId);
    }
    else {
        comment.likes.push(new mongoose_1.default.Types.ObjectId(userId));
    }
    yield comment.save();
    res.status(200).json({ message: alreadyLiked ? "Comment unlike" : "Comment like", "Total Likes": comment.likes.length });
}));
exports.replyCommentController = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id: postId, commentId } = req.params;
    const { content, parentComment } = req.body;
    let commentImageUrl = null;
    const files = req.files;
    const commentImageUrl_path = (_a = files.commentImageUrl) === null || _a === void 0 ? void 0 : _a[0].path;
    try {
        if (commentImageUrl_path) {
            try {
                commentImageUrl = yield (0, cloudinary_1.uploadToCloudinary)(commentImageUrl_path);
            }
            catch (error) {
                console.log(error);
                fs_1.default.unlinkSync(commentImageUrl_path);
            }
        }
        if (!content) {
            res.status(400);
            throw new Error("Content is required");
        }
        const parentComment = yield comment_1.Comment.findById(commentId);
        if (!parentComment) {
            res.status(404);
            throw new Error("Parent comment not found");
        }
        if (parentComment.post.toString() != postId) {
            res.status(400);
            throw new Error("Comment does not belong to the specified post");
        }
        const replyComment = new comment_1.Comment({
            comment_author: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
            post: postId,
            parentComment: parentComment._id,
            content,
            commentImageUrl
        });
        yield replyComment.save();
        res.status(200).json(replyComment);
    }
    catch (error) {
        console.log("Error at registeration");
        fs_1.default.unlinkSync(commentImageUrl_path);
        next(error);
    }
}));
