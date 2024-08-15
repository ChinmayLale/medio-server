import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { ApiError } from './utils/ApiError.js'

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true , limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())



//Routes
import userRouter from './routes/user.routes.js'
import doctorRouter from './routes/doctor.routes.js'
import hospitalRouter from './routes/hospital.routes.js'




//User Routes Declaration
app.use("/api/v1/users",userRouter)




//Doctors Route Declaration
app.use("/api/v1/doctor",doctorRouter)



//Hospital Routes Declaration
app.use('/api/v1/hospital',hospitalRouter)























// Custom Error Handling 
app.use((err, req, res, next) => {
    console.error(err); // Log the error for debugging

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
            data: err.data,
            statusCode: err.statusCode
        });
    }

    // For unhandled errors
    return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
        errors:err.data,
        statusCode: 500
    });
});



export {app}