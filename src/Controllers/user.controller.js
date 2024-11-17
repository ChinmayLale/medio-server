import { User } from "../models/user.model.js";
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { uploadOnCloud } from "../utils/cloudinary.js";
import fs from "fs"
import { Appointment } from "../models/appointment.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Hospital } from "../models/hospital.model.js";
import mongoose from "mongoose";



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

    // console.log(existedUser);
    
    if(existedUser){
       throw new ApiError(409, "User With Email or Username Already Exists")
    }


    // console.log(await req.files.avatar)
    const avatarLocalPath = await req.files?.avatar?.[0]?.path || null;
    // const coverImageLocalPath = await req.files?.coverImage[0]?.path || null;
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

   const loggedInUser = await User.findById(user._id).select("-password")

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
    const populatedUser = await User.findById(req.user._id).select('-password -refreshToken -createdAt -updatedAt')
        .populate({
            path: 'medicalHistory',
            select: 'doctor hospital date treatment prescription',
            populate: [
                { path: 'doctor', select: 'fullName' },
                { path: 'hospital', select: 'hospitalName' }
            ]
        });

    if (!populatedUser) {
        throw new ApiError(404, "User not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        populatedUser,
        "User fetched successfully"
    ))
})

const getAppointment = asyncHandler(async(req,res) => {
    const {dateAndTime , doctorId , hospitalId , description } = req.body;
    const userId = req.user._id;
    if(!dateAndTime || !doctorId || !hospitalId ||  !description || description?.length<1 || !userId){
        throw new ApiError(400 , "All Fields Are Required");
    }
    if (!mongoose.Types.ObjectId.isValid(doctorId) ||!mongoose.Types.ObjectId.isValid(hospitalId) ) {
        throw new ApiError(400, "Invalid doctorId or hospitalId format");
    }

    const doctor = await Doctor.findById(doctorId);
    const hospital = await Hospital.findById(hospitalId);

    if(!doctor || !hospital){
        throw new ApiError(404, "Doctor or Hospital not found");
    }


    const isValidISODate = (dateString) => {
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
        return isoRegex.test(dateString);
    };
    if(!isValidISODate(dateAndTime)){
        throw new Error("Invalid date format. Use ISO 8601 format: YYYY-MM-DD::T::HH:MM:SSZ");
    }

    const appointment = await Appointment.create({
        user:userId,
        doctor:doctorId,
        hospital:hospitalId,
        date:dateAndTime,
        status:"pending",
        reason:description,
    })

    const registeredAppointment = await  Appointment.findById(appointment._id).select("-user");

    if(!registeredAppointment){
        throw new ApiError(500 , "Internal Server Error While Registering appointment")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201,registeredAppointment , "Appointment Registered Successfully !")
        )
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"No refresh token provided")
    }

    const oldRefreshToken =  jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(oldRefreshToken?._id)

    if(!user){
        throw new ApiError(404,"Invalid Refresh Token")
    }

    if(user?.refreshToken != incomingRefreshToken){
        throw new ApiError(401,"Invalid Refresh Token")
    }

    const {accessToken , refreshToken} =await generateTokens(user._id);

    const options = {
        httpOnly: true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200 , {accessToken,refreshToken},"Access Token Refreshed"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    getAppointment,
    refreshAccessToken
}