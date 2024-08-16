import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Doctor } from "../models/doctor.model.js";


export const verifyJwt = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        // console.log(req.cookies)
        if(!token){
            throw new ApiError(401,"Unauthorized Request")
        }
    
        const decodedToken =  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        let user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        if (!user) {
            // If not found in User, search in Doctor collection
            user = await Doctor.findById(decodedToken?._id).select("-password -refreshToken");
        }
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }
    
        req.user = user
    
        next()
    } catch (error) {
        throw new ApiError(401 , "Something Went Wrong While Checking Token")
    }
})