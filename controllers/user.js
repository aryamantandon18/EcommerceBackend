import { Users } from "../models/user.js"
import bcrypt from 'bcrypt'
// import jwt from 'jsonwebtoken'
import { sendCookie } from "../utils/features.js";
import { asyncHandler } from "../middleWares/AsyncErr.js";
import ErrorHandler from "../middleWares/error.js";
import sendEmail from "../utils/sendEmail.js";
import cloudinary from 'cloudinary';

export const register = asyncHandler(async(req,res,next)=>{
const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
  folder:"avatars",
  width:150,
  crop:"scale,"
})

   const {name,email,password} = req.body;
  let user = await Users.findOne({email})

  if(user){
    return res.status(404).json({
      message:"User already exist",
      success: false,
    })
  }
  // const hashedPassword = await bcrypt.hash(password,10);
  user = await Users.create({name,email,password,
  avatar:{
    public_id:myCloud.public_id,
    url:myCloud.secure_url,
  }
  });

 sendCookie(res,user,"Registered Successfully")
 } )



export const Login = async(req,res,next)=>{
 try {
  const {email,password} = req.body;
  console.log("Hello")
  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password",400));
  }
  let user = await Users.findOne({email}).select("+password");

  if(!user){
    return res.status(404).json({
      success:false,
      message: "User does not exist ",
    })
  }
  const isMatch= await bcrypt.compare(password,user.password);
  if(!isMatch){
    return res.status(404).json({
    success:false,
    message: "invalid password or email"})
  };
  sendCookie(res,user,`Welcome Back, ${user.name}`)

  // res.status(200).json({
  //   success:true,
  //   user
  // })
  
 } catch (error) {
  return next(new ErrorHandler(error.message, 500));
 }
};
export const getMyProfile = async(req,res,next)=>{
  console.log("Before user")
  const user = await Users.findById(req.user._id);
console.log(user);
   res.status(201).json({
        success : true,
        user,
    })
};

export const logout = (req,res) => {
    res.status(200).cookie("Token","",{
      expires: new Date(Date.now()),
      sameSite: process.env.node_env === "Develpoment" ? "lax" : "none",
      secure: process.env.node_env === "Develpoment" ? false : true,          
 })
    .json({
      success:true,
      user:req.user,
      message:"Logged out successfully",
    })
}
 
//Forgot password 
export const forgotPassword = asyncHandler(async(req,res,next)=>{ 
 const user = await Users.findOne({email: req.body.email});    //jab forgot pswd krega toh email toh daalega 
 if(!user){
  return next(new ErrorHandler("user not found ", 404));
 }
 //Get resetpswdToken
 const resetToken = user.getResetPasswordToken();
 await user.save({validateBeforeSave:false})

 const resetPasswordUrl = `${process.env.frontend_uri}/password/reset/${resetToken}`;
 const message = `Your reset Password token is \n\n${resetPasswordUrl} \n\nIf you have not requested this email , then please ignore this !`;
 try {
  
  await sendEmail({
    email:user.email,
    subject: `Ecommerce password recovery`,
    message
  });

  res.status(201).json({
    success:true,
    message: `Email send to ${user.email} successfully`,
  })
 } catch (error) {
  user.resetPasswordToken = undefined; 
  user.resetPasswordExpire = undefined;
  await user.save({validateBeforeSave:false})
  return next(new ErrorHandler(error.message , 500));
 }
});  

export const resetPassword = asyncHandler(async(req,res,next)=>{
  const resetPasswordToken = crypto
  .createHash("sha256")
  .update(req.params.token)
  .digest("hex");

  const user = await Users.findOne({
    resetPasswordToken,
    resetPasswordExpire:{$gt: Date.now()},
  })

  if(!user){
    return next(new ErrorHandler("Reset password token is invalid or has been expired",400))
  }

  if (!req.body.password) {
    throw new ErrorHandler('Password cannot be empty',400);
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not password",400));
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendCookie( res,user,"Password Reset Successfully");

})

  export const updatePassword = asyncHandler(async(req,res)=>{
    const user = await Users.findById(req.user._id).select("+password");

    const isPasswordMatch = await bcrypt.compare(req.body.oldPassword,user.password);

    if(!isPasswordMatch){
      return next(new ErrorHandler("Old password is incorrect ",400));
    }
    if(req.body.newPassword !== req.body.confirmPassword){
      return next(new ErrorHandler("password does not match ",400));
    }
    user.password = req.body.newPassword;
    await user.save();

    sendCookie(res,user,"Password Changed successfully");
    
  })

  export const updateProfile = asyncHandler(async(req,res)=>{
   
  const newData={
    name:req.body.name,
    email:req.body.email,
  };

  if(req.body.avatar!==""){
    const user = await Users.findById(req.user._id);
    const imageId = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(imageId);
    
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder:"avatars",
      width:150,
      crop:"scale,"
    })
    newData.avatar = {
      public_id:myCloud.public_id,
      url:myCloud.secure_url,
    }


  }
  const user = await Users.findByIdAndUpdate(req.user._id,newData,{
    new:true,
    runValidators:true,
    useFindAndModify : false,
  })

  res.status(200).json({
    success:true,
    message:"profile updated",
    user
  })
    
    
  })
 //Update role
  export const updateRole = asyncHandler(async(req,res)=>{
   
    const newData={
      name:req.body.name,
      email:req.body.email,
      role: req.body.role,
    };
  
    const user = await Users.findByIdAndUpdate(req.params.id,newData,{
      new:true,
      runValidators:true,
      useFindAndModify : false,
    })
    res.status(200).json({
      success:true,
      message:"Role updated"
    })
  })
     
  //admin
  export const deleteUser = asyncHandler(async(req,res,next)=>{
  await Users.findOneAndDelete(req.params.id,(err,deletedDoc)=>{
    if(deletedDoc == null)   return next(new ErrorHandler(`User not exist with id -> ${req.params.id}`))
    if(err){
      next(err);
    }
  })
  
res.json(200).json({
      success:true,
      message:"User deleted successfully"
    })
  })
      

 //get all users (admin)
  export const getAllUsers = asyncHandler(async(req,res,next)=>{
    const users = Users.find();
    res.status(200).json({
      success:true,
      users,
    })
  })

  //get single user (admin)
  export const getUserById = asyncHandler(async(req,res)=>{
    const user = Users.findById(req.params.id);
    if(!user){
    return next(new ErrorHandler(`No user exist with id -> ${req.params.id}`)); 
    }
   res.status(200).json({
      success:true,
      user
    })
  })




// console.log(req.params);