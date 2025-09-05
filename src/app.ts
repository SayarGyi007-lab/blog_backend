import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import { connectDb } from "./db"
import UserRoute from "./routes/user"
import PostRoute from "./routes/post"
import CommentRoute from "./routes/comment"
import cookieParser from 'cookie-parser'
import { summarizeContent } from "./controller/summary"

dotenv.config({
    path: ".env"
})

const app = express()
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))
app.use(cookieParser())

app.use(express.json())
app.use(express.urlencoded({ extended: true }));


app.use(UserRoute)
app.use(PostRoute)
app.use(CommentRoute)
app.post("/api/summarize",summarizeContent)

const PORT = process.env.PORT || 4000

app.listen(PORT,()=>{
    connectDb()
    console.log(`Server is running on PORT ${PORT}`);
    
})