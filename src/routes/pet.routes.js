import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { registerPet } from "../Controllers/pet.controller.js";


const router = Router()


//All Secured Routes
router.route('/register').post(verifyJwt , registerPet)




export default router