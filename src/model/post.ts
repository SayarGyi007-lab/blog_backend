import mongoose, { Schema, Types, Document } from "mongoose";


interface IPost extends Document{
    title?: string,
    content?: string,
    tag?: string[] ,
    post_author: Types.ObjectId,
    visibility: "public" | "private",
    likes: Types.ObjectId[],
    shared_from?:Types.ObjectId,
    share_caption?:string,
    postImageUrl?: string | any
 
}

const postSchema = new Schema<IPost>({
    title:{
        type: String,
        required: function (this: IPost) {
            return !this.shared_from; // only required if not a shared post
          },
        trim: true,
        maxlength: 150
    },
    content:{
        type: String,
        required: function (this: IPost) {
            return !this.shared_from; // only required if not a shared post
          }
    },
    tag:{
        type: [String],
        required: function (this: IPost) {
            return !this.shared_from; // only required if not a shared post
          }
    },
    post_author:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    visibility:{
        type: String,
        enum: ["public","private"],
        default: "public"
    },
    likes:[{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    shared_from:{
        type: Schema.Types.ObjectId,
        ref: "Post",
        default: null
    },
    share_caption:{
        type: String,
        default: ""
    },
    postImageUrl:{
        type: [String],
        required: function (this: IPost) {
            return !this.postImageUrl; // only required if not a shared post
        },
    }

},{timestamps: true})


export const Post = mongoose.model<IPost>("Post",postSchema)