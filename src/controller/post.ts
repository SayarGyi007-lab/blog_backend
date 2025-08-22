import { NextFunction, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { Post } from "../model/post";
import { AuthRequest } from "../middlewares/protect";
import mongoose from "mongoose";
import fs from 'fs'
import { uploadToCloudinary } from "../utils/cloudinary";

//create post

export const postCreate = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log(req.files);

    const { title, content, tag, visibility } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const imageFiles = files.postImageUrl; 
    const postImageUrls: string[] = [];

    try {
        
        if (imageFiles && imageFiles.length > 0) {
            for (const file of imageFiles) {
                try {
                    const cloudinaryUrl = await uploadToCloudinary(file.path);

                    if (cloudinaryUrl) {
                        postImageUrls.push(cloudinaryUrl);
                    } else {
                        console.error("Failed to upload image to Cloudinary:", file.filename);
                    }
                } catch (uploadError) {
                    console.error("Upload failed for:", file.filename, uploadError);
                } finally {
                    
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                }
            }
        }

        const newPost = new Post({
            title,
            content,
            tag,
            visibility,
            postImageUrl: postImageUrls, 
            post_author: req.user?._id
        });

        const savedPost = await newPost.save();
        const populatedPost = await savedPost.populate("post_author", "name email");

        res.status(200).json(populatedPost);
    } catch (error) {
        console.error("Error at posting:", error);

        
        if (imageFiles) {
            for (const file of imageFiles) {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            }
        }

        next(error);
    }
});

//delete post
export const deletePost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const post = await Post.findById(id)
    if (!post) {
        res.status(404)
        throw new Error("No Post Found")
    }

    const userId = req.user?._id;
    const isAdmin = req.user?.role === "admin";
    const isOwner = post.post_author.equals(userId);

    if (!isAdmin && !isOwner) {
        res.status(403);
        throw new Error("You are not authorized to delete this post");
    }
    await Post.findByIdAndDelete(id)
    res.status(202).json({ message: "Post deleted successfully" })
})

//posts on userwall
export const getAllPostOnUserWall = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.query.user as string
    const currentUser = req.user

    let query = {}

    if (currentUser?.role == "admin") {
        if (userId) {
            query = { post_author: userId }
        }
    } else {
        if (!userId) {
            res.status(400)
            throw new Error("User id is required")
        }
        if (currentUser?._id.toString() == userId) {
            query = { post_author: userId }
        } else {
            query = { post_author: userId, visibility: "public" }

        }
    }
    const post = await Post.find(query).populate("post_author", "name email").populate("likes", "name").sort({ createdAt: -1 })

    if (!post || post.length === 0) {
        res.status(200).json({
            message: "No public posts available or all posts are private.",
        });
        return
    }
    res.status(200).json(post)
})

//get specific post
export const getPostById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const loggedInUser = req.user

    const post = await Post.findById(id)
        .populate("post_author", "name email")
        .populate("likes", "name")
        .populate({
            path: "shared_from",
            populate: { path: "post_author", select: "name email" }
        });;

    if (!post) {
        res.status(404)
        throw new Error("No post found")
    }

    const isAdmin = loggedInUser?.role === "admin"
    const isOwner = loggedInUser?._id.toString() === post.post_author._id.toString()

    if (post.shared_from) {
        const originalPost = post.shared_from as any;

        // Check visibility of original post
        const originalIsOwner = originalPost.post_author._id.toString() === loggedInUser?._id.toString();
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
        res.status(200).json(post)
        return
    } else {
        if (post.visibility == "public") {
            res.status(200).json({
                title: post.title,
                content: post.content,
                tag: post.tag,
                likes: post.likes,
                postImageUrl: post.postImageUrl,

            })
            return
        }
        res.status(403).json({ message: "Post is private" })
    }
})

//update post
export const updatePost = asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log(req.files);
    
    const { id } = req.params
    const { title, content, tag, visibility, postImageUrl } = req.body
    const loggedInUser = req.user

    const files = req.files as {[fieldname: string]: Express.Multer.File[]}
    const imageFiles = files?.postImageUrl || []
    const uploadedImageUrls: string[] = []

    const post = await Post.findById(id)

    if (!post) {
        res.status(404)
        throw new Error("No post found")
    }
    const isOwner = loggedInUser?._id.toString() === post.post_author.toString()


    if (!isOwner) {
        res.status(403);
        throw new Error("Not authorized,Only the post owner can update this post.");
    }

    try {
        if(imageFiles.length>0){
            for(const file of imageFiles){
               try {
                 const cloudinaryUrl = await uploadToCloudinary(file.path)
                 if(cloudinaryUrl){
                     uploadedImageUrls.push(cloudinaryUrl)
                 }
               } catch (error) {
                console.error("Upload failed for:", file.filename, error);
               }finally{
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
               }
            }
        }
        post.title = title || post.title
        post.content = content || post.content
        post.tag = tag || post.tag
        post.visibility = visibility || post.visibility

        let finalImageList: string[] = [];
        if (postImageUrl) {
            finalImageList = Array.isArray(postImageUrl) ? postImageUrl : [postImageUrl];
        }

        if (uploadedImageUrls.length > 0) {
            finalImageList = [...finalImageList, ...uploadedImageUrls];
        }
        finalImageList = [...new Set(finalImageList)];
        post.postImageUrl = finalImageList;

        const updatedPost = await post.save()

    res.status(200).json(updatedPost)

    } catch (error) {
        console.error("Error updating post:", error);

        for (const file of imageFiles) {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
    }

})

//global feed
export const globalFeed = asyncHandler(async (req: AuthRequest, res: Response) => {
    const currentUser = req.user

    const query = {
        $or: [
            { visibility: "public" },
            { post_author: currentUser?._id }
        ]
    }
    const post = await Post.find(query).populate("post_author", "name email").populate("likes", "name").sort({ createdAt: -1 })
    res.status(200).json(post)
})

//search bar
export const searchPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { search } = req.query

    if (!search) {
        throw new Error("Search query is required")
    }

    const post = await Post.find({
        $or: [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
            { tag: { $regex: search, $options: "i" } }
        ],
        visibility: "public"
    }).populate("post_author", "name email").populate("likes", "name").sort({ createdAt: -1 })

    res.status(200).json(post)
})

//like post
export const likePost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const userId = req.user?._id

    const post = await Post.findById(id)

    if (!post) {
        res.status(404)
        throw new Error("No post found")
    }

    const alredyLiked = post.likes.some(likeId => likeId.equals(new mongoose.Types.ObjectId(userId)))

    if (alredyLiked) {
        post.likes = post.likes.filter(likeId => !likeId.equals(new mongoose.Types.ObjectId(userId)))
    } else {
        post.likes.push(new mongoose.Types.ObjectId(userId))
    }
    await post.save()

    res.status(200).json({ message: alredyLiked ? "Post unlike" : "Post like", "Total Likes": post.likes.length })
})

//share posts
export const sharePost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { share_caption, visibility } = req.body

    const originalPost = await Post.findById(id)

    if (!originalPost) {
        res.status(404);
        throw new Error("Original post not found");
    }

    const isOwner = originalPost.post_author.toString() == req.user?._id.toString()
    if (originalPost.visibility != "public" && !isOwner) {
        res.status(403);
        throw new Error("You cannot share this post");
    }

    const sharedPost = new Post({
        post_author: req.user?._id,
        shared_from: originalPost._id,
        share_caption: share_caption || "",
        visibility: visibility || "public"
    })

    const saveSharedPost = await sharedPost.save()
    const populatedSharedPost = await (await saveSharedPost
        .populate("post_author", "name email"))
        .populate({
            path: "shared_from",
            populate: { path: "post_author", select: "name email" }
        });

    res.status(201).json(populatedSharedPost);
})

// edit shared post
export const updateSharedPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params; // shared post id
    const { share_caption, visibility } = req.body;
    const loggedInUser = req.user;

    const post = await Post.findById(id);

    if (!post) {
        res.status(404);
        throw new Error("Shared post not found");
    }


    if (!post.shared_from) {
        res.status(400);
        throw new Error("This is not a shared post");
    }

    if (post.post_author.toString() !== loggedInUser?._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to edit this shared post");
    }



    post.share_caption = share_caption || post.share_caption
    post.visibility == visibility || post.visibility

    const updatedPost = await post.save();

    const populatedPost = await (await updatedPost
        .populate("post_author", "name email"))
        .populate({
            path: "shared_from",
            populate: { path: "post_author", select: "name email" }
        });

    res.status(200).json(populatedPost);
});
