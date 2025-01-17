import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password Is Required"]

        },
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        avatar: {
            type: String,
            required: true
        },
        coverImage: {
            type: String
        },
        pets:[
            {
                type: Schema.Types.ObjectId,
                ref: 'Pet'
            }
        ],
        refreshToken: {
            type: String,
        }
    },
    { timestamps: true }
)


userSchema.pre("save",async function(next){
    if (!this.isModified("password")) 
        return next();

    this.password = await bcrypt.hash(this.password , 10);
    next()
})


userSchema.methods.isPasswordCorrect = async function (password){
   return await bcrypt.compare(password,this.password)
}


userSchema.methods.generateAcessToken = async function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.RefreshToken = async function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User",userSchema)
