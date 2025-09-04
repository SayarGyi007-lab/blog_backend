"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = void 0;
const admin = (req, res, next) => {
    var _a;
    console.log('req.user:', req.user);
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        res.status(403);
        throw new Error('Admin access required');
    }
    next();
};
exports.admin = admin;
