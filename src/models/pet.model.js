import mongoose , {Schema} from "mongoose";
import { User } from "./user.model.js";




const petSchema = new Schema({
    name:{
        type:String,
        required:true,
        lowercase: true
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






petSchema.post("save",async function(doc,next){
    try {
        const updatedUser = await User.findByIdAndUpdate(
            doc.owner,
            { $addToSet: { pets: doc._id } },
            { new: true }
        ).populate('pets');
        
        // console.log('User updated:', updatedUser);
        next();
    } catch (error) {
        console.error('Error updating user after pet save:', error);
    }
})


export const Pet = mongoose.model("Pet",petSchema)