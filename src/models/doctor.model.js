import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const doctorSchema = new Schema({
    fullName: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    specialization: [{ 
        type: String, 
        required: true 
    }],
    licenseNumber:{
        type:String,
        required:[true, "licenseNumber Is Required"],
        unique:true
    },
    experience: { 
        type: Number,
        required:true,
        default:0
    },
    hospital: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Hospital" 
    },
    patients: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    }],
    avatar: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
    }
},{timestamps:true});





doctorSchema.pre("save",async function(next){
    if (!this.isModified("password")) 
        return next();

    this.password = await bcrypt.hash(this.password , 10);
    next()
})

doctorSchema.methods.generateAccessToken = async function (){
    return jwt.sign(
        {
            _id:this._id,
            name:this.fullName,
            email:this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

doctorSchema.methods.generateRefreshToken = async function (){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}




export const Doctor = mongoose.model("Doctor",doctorSchema)
