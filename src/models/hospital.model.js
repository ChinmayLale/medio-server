import mongoose , {Schema} from "mongoose";
import bcrypt from "bcrypt"


const hospitalSchema = new Schema(
    {
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
    },
    {
        timestamps:true
    }
)


hospitalSchema.pre("save",async function(next){
    if(!this.isModified('password')){
        next()
    }
    this.password = await bcrypt.hash(this.password,10)
    next()
})


hospitalSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password)
}

hospitalSchema.methods.generateAccessToken = async function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            hospitalName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

hospitalSchema.methods.generateRefreshToken = async function(){
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



export const Hospital = mongoose.model("Hospital",hospitalSchema)