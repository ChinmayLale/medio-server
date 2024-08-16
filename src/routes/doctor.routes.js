import { Router } from "express";
import { addMedicalReport, loginDoctor, logoutDoctor, registerDoctor } from "../Controllers/doctor.controller.js";
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

router.route('/login').post(loginDoctor)



//Secured Routes
router.route('/addMedicalRecord').post(verifyJwt , addMedicalReport)
router.route('/logout').post(verifyJwt , logoutDoctor)



export default router
