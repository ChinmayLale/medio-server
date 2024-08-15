import { User } from "../models/user.model.js";
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {ApiResponse} from "../utils/ApiResponse.js"
import { uploadOnCloud } from "../../../Backend/src/utils/cloudinary.js";
import fs from "fs"

const generateTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken =await user.generateAccessToken()
        const refreshToken =await user.generateRefreshToken()
        // console.log(accessToken , refreshToken);
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken , refreshToken}
    } catch (error) {
        throw new ApiError(500 , "Somthing Went Wrong While Generating Tokens")
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    const { fullName, email, username, password , date_of_birth , gender , contact_number } = req.body
    
    if (!fullName || !email || !username || !password || !date_of_birth || !gender || !contact_number) {
        throw new ApiError(400, "All fields are required");
    }

    // Now that we know the fields exist, we can safely trim and check for empty strings
    if ([fullName, email, username, password , date_of_birth , gender , contact_number].some((field) => field.trim() === "")) {
        throw new ApiError(400, "Empty fields are not allowed");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
       throw new ApiError(409, "User With Email or Username Already Exists")
    }


    // console.log(await req.files.avatar)
    const avatarLocalPath = await req.files?.avatar?.[0]?.path || null;
    const coverImageLocalPath = await req.files?.coverImage[0]?.path || null;
    



    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file Is Required")
    }

    const avatar = await uploadOnCloud(avatarLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar Upload Failed")
    }
    
    const user = await User.create({
        fullName,
        email,
        password,
        username:username.toLowerCase(),
        avatar:avatar.url,
        date_of_birth,
        gender,
        contact_number,
    })

    if(avatar.url){
        fs.unlinkSync(avatarLocalPath);
    }

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something Went Wrong While Registering User")
    }

   
  
    return res
        .status(201)
        .json(
            new ApiResponse(200,createdUser , "User Registered Successfully !")
        )

})

const loginUser = asyncHandler(async(req,res)=>{
    const {email , username , password} = req.body;
    if(!email && !username){
        throw new ApiError(400,"Email or Username is Required")
    }

    const user = await User.findOne({$or:[{email}, {username}]})

    if(!user){
        throw new ApiError(404,"User Not Found")
    }
    
    const isPasswordCorrect =await user.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        throw new ApiError(401,"Password Is Incorrect")
    }

   const {accessToken , refreshToken} = await generateTokens(user._id)

   const loggedInUser = await User.findById(user._id)

   const options = {
        httpOnly:true,
        secure:true
   }

   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(new ApiResponse(200,{user:loggedInUser , accessToken , refreshToken},"User Logged In SuccesFully"))
        
})

const logoutUser = asyncHandler(async(req,res)=>{
    const user = await User.findOneAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User Logged Out"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})



export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser
}