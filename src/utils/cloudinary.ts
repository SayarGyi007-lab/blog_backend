import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config()

cloudinary.config({ 
    cloud_name: 'dtrqav44c', 
    api_key: '564479735666873', 
    api_secret: process.env.CLOUDINARY_API_KEY // Click 'View API Keys' above to copy your API secret
});

export const uploadToCloudinary = async (filePath: string)=>{
    try {
        const uploadResult = await cloudinary.uploader.upload(filePath,{
            resource_type: "auto"
        })
        console.log("Uploaded Successfully",uploadResult.url);
        fs.unlinkSync(filePath)
        console.log(filePath);
        return uploadResult.url
    } catch (error) {
        console.log("Error at uploading to cloudinary",error);
        fs.unlinkSync(filePath)
        return null
    }   
}