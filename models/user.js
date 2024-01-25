import mongoose from 'mongoose'
import validator from 'validator'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,"please enter your name"],
        maxLength:[30 , "Name cannot exceed 30 characters "]
     },
     email: {
         type: String,
         unique: true,
         required: true,
         validate:[validator.isEmail,"please enter a valid email"]
     },
     password: {
         type: String, 
         select: false,   //do not give password in mongodb while searching for user
         minLength:[8,"password should be greater than 8 characters"] ,
         required: true,
     },
     avatar:{
        
            public_id:{
                type:String,
                required:true,
            },
            url:{
                type:String,
                required:true
            }
        
     },
     role:{
        type:String,
        default:"user"
     },
     resetPasswordToken:String,
     resetPasswordExpire:Date,
     createdAt:{
         type:Date,
         deafault: Date.now,
     },
    
})

schema.pre("save", async function (next) {
    if (!this.isModified("password")) {
      next();
    }
  
    this.password = await bcrypt.hash(this.password, 10);
  });

schema.methods.getResetPasswordToken = function(){
const resetToken = crypto.randomBytes(20).toString("hex");

this.resetPasswordToken = crypto
.createHash("sha256")
.update(resetToken)
.digest("hex")

this.resetPasswordExpire = Date.now() + 15*60*1000;
return resetToken;
}
export const Users = mongoose.model("user",schema);

