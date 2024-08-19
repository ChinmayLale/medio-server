import { Router } from "express";
import { registerUser , loginUser , logoutUser , getCurrentUser, refreshAccessToken } from "../Controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()


router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),    
    registerUser
)


router.route("/login").post(loginUser)

//secured routes
router.route('/refresh-token').post(refreshAccessToken)
router.route('/myAccount').post(verifyJwt , getCurrentUser)
router.route("/logout").post(verifyJwt,  logoutUser)






export default router