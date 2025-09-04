"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImageCount = void 0;
const validateImageCount = (req, res, next) => {
    const files = req.files;
    const imageFiles = files.postImageUrl;
    if (!imageFiles || imageFiles.length < 3) {
        return res.status(400).json({ message: "At least 3 photos are required." });
    }
    if (imageFiles.length > 10) {
        return res.status(400).json({ message: "No more than 10 photos are allowed." });
    }
    next();
};
exports.validateImageCount = validateImageCount;
