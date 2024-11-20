import { Doctor } from "../models/doctor.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloud } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import fs from "fs";
import { MedicalRecord } from "../models/medicalRecords.model.js";
import mongoose from "mongoose";
import { Medicaltest } from "../models/medicalTest.model.js";
import { Appointment } from "../models/appointment.model.js";


const generateTokens = async (userId) => {
    try {
        // console.log(userId)
        const user = await Doctor.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        // console.log(accessToken , refreshToken);
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Something Went Wrong While Generating Tokens ")
    }
}

const registerDoctor = asyncHandler(async (req, res) => {
    const { fullName, email, password, specialization, licenseNumber, experience } = req.body

    if (!fullName || !email || !password || !specialization || !licenseNumber || !experience) {
        throw new ApiError(400, "All Fields Are Required")
    }

    if ([fullName, email, password, specialization[0], licenseNumber, experience].some((field) => field.trim() === "")) {
        throw new ApiError(400, "Empty fields are not allowed");
    }

    const existedUser = await Doctor.findOne({
        $or: [{ licenseNumber }, { email }]
    })

    const avatarLocalPath = await req.files?.avatar?.[0]?.path || null;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Profile Picture is required")
    }

    if (existedUser) {
        fs.unlinkSync(avatarLocalPath);
        throw new ApiError(409, "Doctor Already Registered")
    }



    const profile = await uploadOnCloud(avatarLocalPath);

    if (!profile.url) {
        throw new ApiError(500, "Failed to upload profile picture")
    }


    const doctor = await Doctor.create({
        fullName,
        email,
        password,
        specialization,
        licenseNumber,
        experience,
        avatar: profile.url
    })

    const createdDoc = await Doctor.findById(doctor._id).select("-password")

    if (!createdDoc) {
        throw new ApiError(500, "Failed to register , Internal Server Error")
    }

    if (profile.url) {
        fs.unlinkSync(avatarLocalPath)
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, createdDoc, "Registration Successful")
        )
})

const loginDoctor = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        throw new ApiError(400, "Please provide email and password")
    }

    const checkDoc = await Doctor.findOne({ email })

    if (!checkDoc) {
        throw new ApiError(404, "Doctor not found")
    }

    const isPasswordCorrect = await checkDoc.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Password Is Incorrect")
    }

    const { accessToken, refreshToken } = await generateTokens(checkDoc._id)

    const loggedInUser = await Doctor.findById(checkDoc._id)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Doctor Logged In Successfully"))


})

const logoutDoctor = asyncHandler(async (req, res) => {
    const doc = await Doctor.findOneAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"))
})

const addMedicalReport = asyncHandler(async (req, res) => {
    const { patient, hospital, doctor, date, diagnosis, treatment, prescription, test } = req.body

    if (!patient && !doctor && !hospital && !date && !diagnosis && !treatment && !prescription) {
        throw new ApiError(400, "All Fields Are Required")
    }


    if ([patient, hospital, doctor, diagnosis, treatment].some((field) => field.trim() === "")) {
        throw new ApiError(400, "Empty fields are not allowed");
    }

    let patientId = ""
    let hospitalId = ""
    let doctorId = ""
    try {
        patientId = new mongoose.Types.ObjectId(patient);
        hospitalId = new mongoose.Types.ObjectId(hospital);
        doctorId = new mongoose.Types.ObjectId(doctor);
    } catch (error) {
        console.log(error)
        throw new ApiError(400, "Invalid ID format for patient, hospital, or doctor");
    }

    const prevRecord = await MedicalRecord.findOne({ date })

    if (prevRecord) {
        throw new ApiError(400, "Medical Record Already Exists For This Date , Update existing record")
    }

    let medicalTest = ""
    if(test){
        const {testName , testResult , testDate , labName} = test;
        if(!testName || !testDate){
            throw new ApiError(400, "Test Name and Date are required");
        }
        medicalTest =await  Medicaltest.create({
            testName:testName,
            testResult:testResult || "",
            testDate:testDate || Date.now(),
            labName:labName || ""
        })

    }

    const newRecord = await MedicalRecord.create({
        patient: patientId,
        hospital: hospitalId,
        doctor: doctorId,
        date,
        diagnosis,
        treatment,
        prescription,
        test: test ? medicalTest : null
    })

    const createdRecord = await MedicalRecord.findById(newRecord._id).populate('patient', 'fullName').populate('doctor', 'fullName').populate('hospital', 'hospitalName');

    if (!createdRecord) {
        throw new ApiError(500, "Error While Creating Record , Internal Server Error")
    }

    return res.status(201)
        .json(
            new ApiResponse(201, createdRecord, "Medical Record Added Successfully")
        )
})

const getAllAppointments = asyncHandler(async ( req , res)=>{
    const userId = req.user._id;
    const appointments = await Appointment.find({doctor:userId})
        .populate({
            path: 'user',
            select: '-password -date_of_birth -refreshToken -username  -medicalHistory -createdAt -updatedAt' 
        })
        .populate({
            path: 'hospital',
            select: '-password -departments -registeredPatients -licenseNumber -createdAt -updatedAt' 
        }).select('-doctor');
    if(!appointments){
        throw new ApiError(404, "No Appointments Found")
    }
    return res.status(200)
    .json(
        new ApiResponse(200, appointments, "All Appointments Retrieved Successfully")
    )
})

const toggleAppointmentStatus = asyncHandler(async(req , res)=>{
    const {appointmentId , status} = req.body;
    if(!appointmentId || !status){
        throw new ApiError(400, "Appointment ID is Required");
    }
    const appointment = await Appointment.findById(appointmentId);
    if(!appointment){
        throw new ApiError(404, "Appointment Not Found")
    }
    const allStatus = ["pending", "confirmed", "cancelled", "completed"]
    if(!allStatus.includes(status)){
        throw new ApiError(400, "Invalid Status")
    }
    if(!status==="pending" || !status==="confirmed"){
        throw new ApiError(400, "Can't Change Status for Completed or Cancelled appointments")
    }
    appointment.status = status;
    await appointment.save();
    return res.status(200)
    .json(
        new ApiResponse(200, appointment, "Appointment Status Updated Successfully")
    )
})


export {
    registerDoctor,
    loginDoctor,
    logoutDoctor,
    addMedicalReport,
    getAllAppointments,
    toggleAppointmentStatus
}