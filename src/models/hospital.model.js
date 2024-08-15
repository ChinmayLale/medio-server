import mongoose , {Schema} from "mongoose";

const hospitalSchema = new Schema({
    hospitalName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    licenseNumber:{
        type:String,
        required:true
    },
    departments:[
        {
            type:String,
            required:true
        }
    ],
    registeredPatients:[{
        type:Schema.Types.ObjectId,
        ref:'User'
    }]
},{timestamps:true})


export const Hospital = mongoose.model("Hospital",hospitalSchema)