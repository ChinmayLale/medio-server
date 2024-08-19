import mongoose , {Schema} from "mongoose";
import { User } from "./user.model.js";
import { ApiError } from "../utils/ApiError.js";



const MedicalRecordSchema = new Schema(
    {
        patient:{
            type: Schema.Types.ObjectId,
            ref: 'User',
            index:true
        },
        hospital:{
            type: Schema.Types.ObjectId,
            ref: 'Hospital',
            index:true
        },
        doctor:{
            type: Schema.Types.ObjectId,
            ref: 'Doctor',
            index:true
        },
        date:{
            type:Date,
            default:Date.now
        },
        diagnosis:{
            type:String,
            required:true
        },
        treatment:{
            type:String,
            required:true
        },
        prescription:[{
            type:String,
            required:true
        }],
        test:{
            type:Schema.Types.ObjectId,
            ref: 'Medicaltest',
        }
    },
    {
        timestamps: true
    }
)


MedicalRecordSchema.post("save",async function(doc,next) {
    try {
        await User.findByIdAndUpdate(
            doc.patient,
            { $addToSet: { medicalHistory: doc._id } }
        )
    } catch (error) {
        console.error('Error updating User medicalHistory:', error);
        // The MedicalRecord is already saved at this point
        throw new ApiError(401,"Error Updating Medical History...")
    }
    next()
    
})


export const MedicalRecord = mongoose.model("MedicalRecord",MedicalRecordSchema)