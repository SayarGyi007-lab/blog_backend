import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"

interface IUser extends Document{
    name: string,
    email: string,
    password: string,
    role: string,
    profileImageUrl: string,
    matchPassword(password:string): Promise<boolean>
}

const userSchema  = new Schema<IUser>({
    name:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email:{
        type: String,
        unique: true,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ["user","admin"],
        default: "user"
    },
    profileImageUrl:{
        type: String,
    }
}, {timestamps: true})

userSchema.pre("save",async function (next) {
    if(!this.isModified("password")){
        next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password,salt)
})

userSchema.methods.matchPassword = async function (password:string) {
    if (!password || !this.password) {
        throw new Error("Password or hashed password is missing");
      }
    return await bcrypt.compare(password,this.password)
}


export const User = mongoose.model<IUser>("User",userSchema)