"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
const asyncHandler = (Controlfn) => (req, res, next) => {
    Promise.resolve(Controlfn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
