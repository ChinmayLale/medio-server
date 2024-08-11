import { User } from "../models/user.model.js";
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {ApiResponse} from "../utils/ApiResponse.js"
import { uploadOnCloud } from "../../../Backend/src/utils/cloudinary.js";

const registerUser = asyncHandler(async(req,res)=>{
    const { fullName, email, username, password } = req.body


    if (!fullName || !email || !username || !password) {
        throw new ApiError(400, "All fields are required");
    }

    // Now that we know the fields exist, we can safely trim and check for empty strings
    if ([fullName, email, username, password].some((field) => field.trim() === "")) {
        throw new ApiError(400, "Empty fields are not allowed");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
       throw new ApiError(409, "User With Email or Username Already Exists")
    }


    // console.log(req.files)
    const avatarLocalPath = await req.files?.avatar?.[0]?.path || null;
    const coverImageLocalPath = await req.files?.coverImage[0]?.path || null;
    



    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file Is Required")
    }

    const avatar = await uploadOnCloud(avatarLocalPath)
    const coverImage = await uploadOnCloud(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar Upload Failed")
    }
    
    const user = await User.create({
        fullName,
        email,
        password,
        username:username.toLowerCase(),
        avatar:avatar.url,
        coverImage:coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something Went Wrong While Registering User")
    }

  
    return res
        .status(201)
        .json(
            new ApiResponse(200,createdUser , "User Registered Succesfully !")
        )

})




export {
    registerUser
}