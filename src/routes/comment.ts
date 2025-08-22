import { Router } from "express";
import { protect } from "../middlewares/protect";
import { addComment, deleteComment, getAllComments, replyCommentController, toggleLikeComment, updateComment } from "../controller/comment";
import { upload } from "../middlewares/multer";

const route = Router()

route.route("/:id/comments").post(protect,upload.fields([{name:"commentImageUrl",maxCount: 1}]),addComment).get(protect,getAllComments)
route.route("/:id/comments/:commentId").delete(protect,deleteComment).put(protect,upload.single("commentImageUrl"),updateComment)
route.put("/comments/:commentId/like", protect, toggleLikeComment);
route.post("/:id/comments/:commentId/reply", protect,upload.fields([{name:"commentImageUrl",maxCount: 1}]), replyCommentController);
//route.get("/:id/comments/nested", protect, getNestedComments);



export default route