import dotenv from 'dotenv'
import mongoose from 'mongoose';
import { User } from '../model/user';
import bcrypt from 'bcrypt'

dotenv.config()

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_LOCAL_URI!)
        const adminEmail = process.env.ADMIN_EMAIL!
        const adminPassword = process.env.ADMIN_PASSWORD!

        const existed = await User.findOne({ email: adminEmail })
        if (existed) {
            console.log("Email already existed");
            return process.exit(0)
        }
        await User.create({
            name: "Admin",
            email: adminEmail,
            password: adminPassword,
            role: "admin",
        })
        console.log("Admin user created!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
createAdmin();