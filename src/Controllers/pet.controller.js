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

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPetNameExist = user.pets.some(pet => pet.name.toLowerCase() === name.toLowerCase())

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
    // await savedPet.populate('owner', 'username email')  // Specify fields you want to populate

    // // Add the new pet to the user's pets array
    // user.pets.push(savedPet._id)
    // await user.save()

    const registredPet = Pet.findById(pet._id).select("-owner")

    if(!registredPet){
        throw new ApiError(401,"Something Went Wrong While Registering Pet")
    }



    res.status(200)
    .json(new ApiResponse(200,pet,"Pet Registered SuccessFully"))

})




export{
    registerPet
}