import { Pet } from "../models/pet.model.js";
import { User } from '../models/user.model.js'
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { populate } from "dotenv";



const registerPet = asyncHandler(async (req,res)=>{
    const {name,age,species,breed,weight,gender,owner} = req.body

    if(!name && !age && !species && !breed && !gender && !owner){
        throw new ApiError(401 , "All Fields Are Required ")
    }

    const user = await User.findById(owner)
    // console.log(user)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPetNameExist = await Pet.findOne({ name , owner });

    if (isPetNameExist) {
        throw new ApiError(400, "A pet with this name already exists for this user")
    }

    const pet =await Pet.create({
        name,
        age,
        species,
        breed,
        weight,
        gender,
        owner:user._id
    })
   

    const registeredPet = await Pet.findById(pet._id).populate('owner', 'username email');

    if(!registeredPet){
        throw new ApiError(401,"Something Went Wrong While Registering Pet")
    }



    res.status(200)
    .json(new ApiResponse(200,pet,"Pet Registered SuccessFully"))

})




export{
    registerPet
}