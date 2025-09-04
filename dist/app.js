"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./db");
const user_1 = __importDefault(require("./routes/user"));
const post_1 = __importDefault(require("./routes/post"));
const comment_1 = __importDefault(require("./routes/comment"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config({
    path: ".env"
});
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(user_1.default);
app.use(post_1.default);
app.use(comment_1.default);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    (0, db_1.connectDb)();
    console.log(`Server is running on PORT ${PORT}`);
});
