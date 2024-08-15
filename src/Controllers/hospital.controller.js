import { Hospital } from "../models/hospital.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";


const registerHospital = asyncHandler(async(req,res)=>{
    const {hospitalName,email,password,licenseNumber,departments,registeredPatients} = req.body

    if(!hospitalName||!email||!password||!licenseNumber||!departments||!registeredPatients){
        throw new ApiError(400,"Please fill all the fields")
    }

    if ([hospitalName,email,password,licenseNumber].some((field) => field.trim() === "")) {
        throw new ApiError(400, "Empty fields are not allowed");
    }

    const isExists =await  Hospital.findOne({
        $or: [{ licenseNumber }, { email }]
    })

    // console.log(isExists);
    

    if(isExists){
        throw new ApiError(400,"Hospital already exists")
    }

    const hospital =await Hospital.create({
        hospitalName,
        email,
        password,
        licenseNumber,
        departments,
        registeredPatients
    })

    const createdHos = await Hospital.findById(hospital._id).select("-password")

    if(!createdHos){
        throw new ApiError(500,"Failed To Register , Internal Server Error")
    }

    return res
    .status(201)
    .json(new ApiResponse(201 , createdHos,"Registration SuccessFul "))
})





export {
    registerHospital
}