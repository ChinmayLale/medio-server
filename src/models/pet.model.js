import mongoose , {Schema} from "mongoose";

const petSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    age:{
        type:Number,
        required:true
    },
    species:{
        type:String,
        required:true,
        default:"Cat",
        enum:["Dog","Cat","Bird"]
    },
    breed:{
        type:String,
        required:true
    },
    weight:{
        type:Number,
        required:true
    },
    gender:{
        type:String,
        required:true,
        enum:["Male","Female"]
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    }
},{timestamps:true})









export const Pet = mongoose.model("Pet",petSchema)