import mongoose , {Schema} from "mongoose";


const MedicalRecordSchema = new Schema(
    {
        patient:{
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        hospital:{
            type: Schema.Types.ObjectId,
            ref: 'Hospital',
        },
        doctor:{
            type: Schema.Types.ObjectId,
            ref: 'Doctor',
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
        prescription:{
            type:String,
            required:true
        },
        test:{
            type:Schema.Types.ObjectId,
            ref: 'Medicaltest',
        }
    },
    {
        timestamps: true
    }
)



export const MedicalRecord = mongoose.model("MedicalRecord",MedicalRecordSchema)