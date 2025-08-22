import mongoose, { Schema } from "mongoose";



const commentSchema = new Schema({
    comment_author:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    post:{
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    content:{
        type: String,
        required: true,
    },
    likes:[{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    commentImageUrl:{
        type: String,
    },
    parentComment: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        default: null
    }
  
},{timestamps: true})

export const Comment = mongoose.model("Comment",commentSchema)