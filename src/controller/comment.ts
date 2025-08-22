import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/protect";
import { asyncHandler } from "../utils/asyncHandler";
import { Post } from "../model/post";
import { Comment } from "../model/comment";
import mongoose from "mongoose";
import fs from "fs"
import { uploadToCloudinary } from "../utils/cloudinary";

export const addComment = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const { content } = req.body

    let commentImageUrl: string | null = null
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const commentImageUrl_path = files.commentImageUrl?.[0].path

    try {
        if (commentImageUrl_path) {
            try {
                commentImageUrl = await uploadToCloudinary(commentImageUrl_path)
            } catch (error) {
                console.log(error);
                fs.unlinkSync(commentImageUrl_path)
            }
        }
        if (!content) {
            res.status(400)
            throw new Error("Content is required")
        }

        const post = await Post.findById(id)
        if (!post) {
            res.status(404)
            throw new Error("No post found")
        }

        const newComment = new Comment({
            comment_author: req.user?._id,
            post: id,
            content,
            commentImageUrl
        })

        await newComment.save()
        res.status(200).json(newComment)
    } catch (error) {
        console.log("Error at registeration");
        fs.unlinkSync(commentImageUrl_path)
        next(error)
    }


})

export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id: postId, commentId } = req.params

    const comment = await Comment.findById(commentId)

    if (!comment) {
        res.status(404)
        throw new Error("No comment found")
    }

    if (comment.post.toString() !== postId) {
        res.status(400);
        throw new Error("Comment does not belong to the specified post");
    }

    const isOwner = comment.comment_author._id.toString() == req.user?._id.toString()
    const isAdmin = req.user?.role == "admin"

    if (!isOwner && !isAdmin) {
        res.status(403)
        throw new Error("Not authorized to delete comment")
    }
    await comment.deleteOne()

    res.status(200).json({ message: "Comment is successfully deleted" })
})

export const getAllComments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    const allComments = await Comment.find({ post: id })
    .populate("comment_author", "name email")
    .sort({ createdAt: -1 })
    .lean()

    const commentMap = new Map<string,any>()
    allComments.forEach(comment =>{
        (comment as any).replies = []
        commentMap.set(comment._id.toString(), comment)
    })

    const rootComments: any[] = []
    allComments.forEach(comment=>{
        if(comment.parentComment){
            const parent = commentMap.get(comment.parentComment.toString())
            if(parent){
                parent.replies.push(comment)
            }
        }else{
            rootComments.push(comment)
        }
    })

    res.status(200).json(rootComments)
})

export const updateComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id: postId, commentId } = req.params
    const { content } = req.body

    const comment = await Comment.findById(commentId)

    if (!comment) {
        res.status(404)
        throw new Error("No comment found")
    }

    if (comment.post.toString() !== postId) {
        res.status(400);
        throw new Error("Comment does not belong to the specified post");
    }

    const isOwner = comment.comment_author._id.toString() == req.user?._id.toString()
    const isAdmin = req.user?.role == "admin"

    if (!isOwner && !isAdmin) {
        res.status(403)
        throw new Error("Not authorized to delete comment")
    }
    comment.content = content || comment.content

    if (req.file?.path) {
        try {
            const cloudinaryUrl = await uploadToCloudinary(req.file.path);
            if (cloudinaryUrl !== null) {
                comment.commentImageUrl = cloudinaryUrl;
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


    const updatedComment = await comment.save()

    res.status(200).json(updatedComment)

})

export const toggleLikeComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { commentId } = req.params
    const userId = req.user?._id.toString()

    const comment = await Comment.findById(commentId)

    if (!comment) {
        res.status(404)
        throw new Error("No comment found")
    }

    const alreadyLiked = comment.likes.some((id) => id.toString() == userId)

    if (alreadyLiked) {
        comment.likes = comment.likes.filter((id) => id.toString() != userId)
    }
    else {
        comment.likes.push(new mongoose.Types.ObjectId(userId))
    }
    await comment.save()

    res.status(200).json({ message: alreadyLiked ? "Comment unlike" : "Comment like", "Total Likes": comment.likes.length })

})

export const replyCommentController = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id: postId, commentId } = req.params
    const { content, parentComment } = req.body

    let commentImageUrl: string | null = null
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const commentImageUrl_path = files.commentImageUrl?.[0].path

    try {
        if (commentImageUrl_path) {
            try {
                commentImageUrl = await uploadToCloudinary(commentImageUrl_path)

            } catch (error) {
                console.log(error);
                fs.unlinkSync(commentImageUrl_path)
            }
        }

        if (!content) {
            res.status(400)
            throw new Error("Content is required")
        }
        const parentComment = await Comment.findById(commentId)

        if (!parentComment) {
            res.status(404);
            throw new Error("Parent comment not found");
        }

        if (parentComment.post.toString() != postId) {
            res.status(400);
            throw new Error("Comment does not belong to the specified post");
        }

        const replyComment = new Comment({
            comment_author: req.user?._id,
            post: postId,
            parentComment: parentComment._id,
            content,
            commentImageUrl
        })
        await replyComment.save()


        res.status(200).json(replyComment)

    } catch (error) {
        console.log("Error at registeration");
        fs.unlinkSync(commentImageUrl_path)
        next(error)
    }



})

