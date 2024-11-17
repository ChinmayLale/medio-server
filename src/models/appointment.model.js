import mongoose from "mongoose";
import { Schema }  from "mongoose";

const appointmentModel = new Schema({
    doctor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Doctor", 
        required: true 
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    hospital: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Hospital", 
        required: true 
    },
    date: { 
        type: Date, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["pending", "confirmed", "cancelled", "completed"], 
        default: "pending" ,
        required: true 
    },
    reason: { 
        type: String ,
        required: true 
    }, // Optional: Why the appointment is booked
}, { timestamps: true });


export const Appointment = mongoose.model("Appointment",appointmentModel);