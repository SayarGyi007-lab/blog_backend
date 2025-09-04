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
exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: 'dtrqav44c',
    api_key: '564479735666873',
    api_secret: process.env.CLOUDINARY_API_KEY // Click 'View API Keys' above to copy your API secret
});
const uploadToCloudinary = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uploadResult = yield cloudinary_1.v2.uploader.upload(filePath, {
            resource_type: "auto"
        });
        console.log("Uploaded Successfully", uploadResult.url);
        fs_1.default.unlinkSync(filePath);
        console.log(filePath);
        return uploadResult.url;
    }
    catch (error) {
        console.log("Error at uploading to cloudinary", error);
        fs_1.default.unlinkSync(filePath);
        return null;
    }
});
exports.uploadToCloudinary = uploadToCloudinary;
