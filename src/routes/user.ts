import { Router } from "express";
import { deleteUser, getAllUser, getUserById, getUserProfile, updateProfile, userLogin, userLogout, userRegister } from "../controller/user"
import { upload } from "../middlewares/multer";
import { protect } from "../middlewares/protect";
import { admin } from "../middlewares/admin";

const route = Router()

route.post("/register", upload.fields([{name:"profileImageUrl",maxCount: 1}]),userRegister)
route.post("/login",userLogin)
route.post("/logout",userLogout)
route.route("/profile").get(protect,getUserProfile).put(protect,upload.single("profileImageUrl"),updateProfile)

route.get("/users",protect,admin,getAllUser)
route.get("/users/:id",protect,getUserById)
route.delete("/delete/:id",protect,deleteUser)

export default route