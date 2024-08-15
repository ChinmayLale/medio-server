import mongoose , {mongo, Schema} from "mongoose";


const MedicalTestSchema = new Schema(
    {
        testName: { 
            type: String, 
            required: true 
        },
        testResult: { 
            type: String 
        },
        testDate: { 
            type: Date, 
            required: true 
        },
        labName: { 
            type: String 
        },
    },
    { 
        timestamps: true 
    }
);



export const Medicaltest = mongoose.model("Medicaltest" , MedicalTestSchema)