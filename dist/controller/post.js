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
exports.updateSharedPost = exports.sharePost = exports.likePost = exports.searchPost = exports.globalFeed = exports.updatePost = exports.getPostById = exports.getAllPostOnUserWall = exports.deletePost = exports.postCreate = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const post_1 = require("../model/post");
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const cloudinary_1 = require("../utils/cloudinary");
//create post
exports.postCreate = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(req.files);
    const { title, content, tag, visibility } = req.body;
    const files = req.files;
    const imageFiles = files.postImageUrl;
    const postImageUrls = [];
    try {
        if (imageFiles && imageFiles.length > 0) {
            for (const file of imageFiles) {
                try {
                    const cloudinaryUrl = yield (0, cloudinary_1.uploadToCloudinary)(file.path);
                    if (cloudinaryUrl) {
                        postImageUrls.push(cloudinaryUrl);
                    }
                    else {
                        console.error("Failed to upload image to Cloudinary:", file.filename);
                    }
                }
                catch (uploadError) {
                    console.error("Upload failed for:", file.filename, uploadError);
                }
                finally {
                    if (fs_1.default.existsSync(file.path)) {
                        fs_1.default.unlinkSync(file.path);
                    }
                }
            }
        }
        const newPost = new post_1.Post({
            title,
            content,
            tag,
            visibility,
            postImageUrl: postImageUrls,
            post_author: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id
        });
        const savedPost = yield newPost.save();
        const populatedPost = yield savedPost.populate("post_author", "name email");
        res.status(200).json(populatedPost);
    }
    catch (error) {
        console.error("Error at posting:", error);
        if (imageFiles) {
            for (const file of imageFiles) {
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            }
        }
        next(error);
    }
}));
//delete post
exports.deletePost = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const post = yield post_1.Post.findById(id);
    if (!post) {
        res.status(404);
        throw new Error("No Post Found");
    }
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === "admin";
    const isOwner = post.post_author.equals(userId);
    if (!isAdmin && !isOwner) {
        res.status(403);
        throw new Error("You are not authorized to delete this post");
    }
    yield post_1.Post.findByIdAndDelete(id);
    res.status(202).json({ message: "Post deleted successfully" });
}));
//posts on userwall
exports.getAllPostOnUserWall = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.query.user;
    const currentUser = req.user;
    let query = {};
    if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) == "admin") {
        if (userId) {
            query = { post_author: userId };
        }
    }
    else {
        if (!userId) {
            res.status(400);
            throw new Error("User id is required");
        }
        if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser._id.toString()) == userId) {
            query = { post_author: userId };
        }
        else {
            query = { post_author: userId, visibility: "public" };
        }
    }
    const post = yield post_1.Post.find(query).populate("post_author", "name email").populate("likes", "name").sort({ createdAt: -1 });
    if (!post || post.length === 0) {
        res.status(200).json({
            message: "No public posts available or all posts are private.",
        });
        return;
    }
    res.status(200).json(post);
}));
//get specific post
exports.getPostById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const loggedInUser = req.user;
    const post = yield post_1.Post.findById(id)
        .populate("post_author", "name email")
        .populate("likes", "name")
        .populate({
        path: "shared_from",
        populate: { path: "post_author", select: "name email" }
    });
    ;
    if (!post) {
        res.status(404);
        throw new Error("No post found");
    }
    const isAdmin = (loggedInUser === null || loggedInUser === void 0 ? void 0 : loggedInUser.role) === "admin";
    const isOwner = (loggedInUser === null || loggedInUser === void 0 ? void 0 : loggedInUser._id.toString()) === post.post_author._id.toString();
    if (post.shared_from) {
        const originalPost = post.shared_from;
        // Check visibility of original post
        const originalIsOwner = originalPost.post_author._id.toString() === (loggedInUser === null || loggedInUser === void 0 ? void 0 : loggedInUser._id.toString());
        if (originalPost.visibility !== "public" && !originalIsOwner && !isAdmin) {
            res.status(403).json({ message: "Original post is private" });
            return;
        }
        // Return merged shared + original data
        res.status(200).json({
            _id: post._id,
            post_author: post.post_author,
            caption: post.share_caption,
            likes: post.likes,
            visibility: post.visibility,
            postImageUrl: post.postImageUrl,
            shared_from: {
                _id: originalPost._id,
                title: originalPost.title,
                content: originalPost.content,
                tag: originalPost.tag,
                post_author: originalPost.post_author,
                createdAt: originalPost.createdAt,
                updatedAt: originalPost.updatedAt
            },
        });
        return;
    }
    if (isAdmin || isOwner) {
        res.status(200).json(post);
        return;
    }
    else {
        if (post.visibility == "public") {
            res.status(200).json({
                title: post.title,
                content: post.content,
                tag: post.tag,
                likes: post.likes,
                postImageUrl: post.postImageUrl,
            });
            return;
        }
        res.status(403).json({ message: "Post is private" });
    }
}));
//update post
exports.updatePost = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.files);
    const { id } = req.params;
    const { title, content, tag, visibility, postImageUrl } = req.body;
    const loggedInUser = req.user;
    const files = req.files;
    const imageFiles = (files === null || files === void 0 ? void 0 : files.postImageUrl) || [];
    const uploadedImageUrls = [];
    const post = yield post_1.Post.findById(id);
    if (!post) {
        res.status(404);
        throw new Error("No post found");
    }
    const isOwner = (loggedInUser === null || loggedInUser === void 0 ? void 0 : loggedInUser._id.toString()) === post.post_author.toString();
    if (!isOwner) {
        res.status(403);
        throw new Error("Not authorized,Only the post owner can update this post.");
    }
    try {
        if (imageFiles.length > 0) {
            for (const file of imageFiles) {
                try {
                    const cloudinaryUrl = yield (0, cloudinary_1.uploadToCloudinary)(file.path);
                    if (cloudinaryUrl) {
                        uploadedImageUrls.push(cloudinaryUrl);
                    }
                }
                catch (error) {
                    console.error("Upload failed for:", file.filename, error);
                }
                finally {
                    if (fs_1.default.existsSync(file.path)) {
                        fs_1.default.unlinkSync(file.path);
                    }
                }
            }
        }
        post.title = title || post.title;
        post.content = content || post.content;
        post.tag = tag || post.tag;
        post.visibility = visibility || post.visibility;
        let finalImageList = [];
        if (postImageUrl) {
            finalImageList = Array.isArray(postImageUrl) ? postImageUrl : [postImageUrl];
        }
        if (uploadedImageUrls.length > 0) {
            finalImageList = [...finalImageList, ...uploadedImageUrls];
        }
        finalImageList = [...new Set(finalImageList)];
        post.postImageUrl = finalImageList;
        const updatedPost = yield post.save();
        res.status(200).json(updatedPost);
    }
    catch (error) {
        console.error("Error updating post:", error);
        for (const file of imageFiles) {
            if (fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
            }
        }
    }
}));
//global feed
exports.globalFeed = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentUser = req.user;
    const query = {
        $or: [
            { visibility: "public" },
            { post_author: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id }
        ]
    };
    const post = yield post_1.Post.find(query).populate("post_author", "name email").populate("likes", "name").sort({ createdAt: -1 });
    res.status(200).json(post);
}));
//search bar
exports.searchPost = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search } = req.query;
    if (!search) {
        throw new Error("Search query is required");
    }
    const post = yield post_1.Post.find({
        $or: [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
            { tag: { $regex: search, $options: "i" } }
        ],
        visibility: "public"
    }).populate("post_author", "name email").populate("likes", "name").sort({ createdAt: -1 });
    res.status(200).json(post);
}));
//like post
exports.likePost = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const post = yield post_1.Post.findById(id);
    if (!post) {
        res.status(404);
        throw new Error("No post found");
    }
    const alredyLiked = post.likes.some(likeId => likeId.equals(new mongoose_1.default.Types.ObjectId(userId)));
    if (alredyLiked) {
        post.likes = post.likes.filter(likeId => !likeId.equals(new mongoose_1.default.Types.ObjectId(userId)));
    }
    else {
        post.likes.push(new mongoose_1.default.Types.ObjectId(userId));
    }
    yield post.save();
    res.status(200).json({ message: alredyLiked ? "Post unlike" : "Post like", "Total Likes": post.likes.length });
}));
//share posts
exports.sharePost = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const { share_caption, visibility } = req.body;
    const originalPost = yield post_1.Post.findById(id);
    if (!originalPost) {
        res.status(404);
        throw new Error("Original post not found");
    }
    const isOwner = originalPost.post_author.toString() == ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString());
    if (originalPost.visibility != "public" && !isOwner) {
        res.status(403);
        throw new Error("You cannot share this post");
    }
    const sharedPost = new post_1.Post({
        post_author: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
        shared_from: originalPost._id,
        share_caption: share_caption || "",
        visibility: visibility || "public"
    });
    const saveSharedPost = yield sharedPost.save();
    const populatedSharedPost = yield (yield saveSharedPost
        .populate("post_author", "name email"))
        .populate({
        path: "shared_from",
        populate: { path: "post_author", select: "name email" }
    });
    res.status(201).json(populatedSharedPost);
}));
// edit shared post
exports.updateSharedPost = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // shared post id
    const { share_caption, visibility } = req.body;
    const loggedInUser = req.user;
    const post = yield post_1.Post.findById(id);
    if (!post) {
        res.status(404);
        throw new Error("Shared post not found");
    }
    if (!post.shared_from) {
        res.status(400);
        throw new Error("This is not a shared post");
    }
    if (post.post_author.toString() !== (loggedInUser === null || loggedInUser === void 0 ? void 0 : loggedInUser._id.toString())) {
        res.status(403);
        throw new Error("Not authorized to edit this shared post");
    }
    post.share_caption = share_caption || post.share_caption;
    post.visibility == visibility || post.visibility;
    const updatedPost = yield post.save();
    const populatedPost = yield (yield updatedPost
        .populate("post_author", "name email"))
        .populate({
        path: "shared_from",
        populate: { path: "post_author", select: "name email" }
    });
    res.status(200).json(populatedPost);
}));
