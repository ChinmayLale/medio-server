import { Doctor } from "../models/doctor.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloud } from "../../../Backend/src/utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import fs from "fs";




const registerDoctor = asyncHandler(async(req,res)=>{
    const {fullName , email , password , specialization , licenseNumber , experience   } = req.body

    if(!fullName || !email || !password || !specialization || !licenseNumber || !experience ){
        throw new ApiError(400,"All Fields Are Required")
    }

    if ([fullName, email, password , specialization , licenseNumber , experience].some((field) => field.trim() === "")) {
        throw new ApiError(400, "Empty fields are not allowed");
    }

    const existedUser = await Doctor.findOne({
        $or: [{ licenseNumber }, { email }]
    })

    const avatarLocalPath = await req.files?.avatar?.[0]?.path || null;

    if(!avatarLocalPath){
        throw new ApiError(400,"Profile Picture is required")
    }

    if(existedUser){
        fs.unlinkSync(avatarLocalPath);
        throw new ApiError(409,"Doctor Already Registered")
    }

    

    const profile = await uploadOnCloud(avatarLocalPath);

    if(!profile.url){
        throw new ApiError(500,"Failed to upload profile picture")
    }

    
    const doctor = await Doctor.create({
        fullName, 
        email,
        password, 
        specialization, 
        licenseNumber, 
        experience, 
        avatar:profile.url
    })

    const createdDoc = await  Doctor.findById(doctor._id).select("-password")

    if(!createdDoc){
        throw new ApiError(500,"Failed to register , Internal Server Error")
    }

    if(profile.url){
       fs.unlinkSync(avatarLocalPath) 
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201 , createdDoc , "Registration Successful")
        )
})





export {
    registerDoctor

}