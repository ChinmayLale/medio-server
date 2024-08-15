import { Router } from "express";
import { registerDoctor } from "../Controllers/doctor.controller.js";
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJwt } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        }
    ]),    
    registerDoctor
)




export default router
