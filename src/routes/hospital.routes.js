import { Router } from "express";
import { registerHospital } from "../Controllers/hospital.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/register').post(registerHospital)




export default router
