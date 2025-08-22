import { Router } from "express";
import { deletePost, getAllPostOnUserWall, getPostById, globalFeed, likePost, postCreate, searchPost, sharePost, updatePost, updateSharedPost } from "../controller/post";
import { protect } from "../middlewares/protect";
import { upload } from "../middlewares/multer";
import { validateImageCount } from "../middlewares/photovalidator";

const route = Router()
route.get("/post/search",protect,searchPost)

route.post("/post/create",protect,upload.fields([{ name: "postImageUrl", maxCount: 10 }]),validateImageCount,postCreate)
route.delete("/post/delete/:id",protect,deletePost)
route.get("/post/",protect,getAllPostOnUserWall)
route.route("/post/:id").get(protect,getPostById).put(protect,upload.fields([{ name: "postImageUrl", maxCount: 10 }]),validateImageCount,updatePost)
route.put("/post/:id/like",protect,likePost)
route.route("/post/:id/share").post(protect,sharePost).put(protect,updateSharedPost)


route.get("/",protect,globalFeed)
export default route