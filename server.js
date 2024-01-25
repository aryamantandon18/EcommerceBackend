import {app} from'./app.js'
import { connectDB } from './data/database.js';
import cloudinary from 'cloudinary';
import Razorpay from 'razorpay'; 

process.on("uncaughtException",(err)=>{
    console.log(`err : ${err.message}`);
    console.log("Shutting doem the server due to uncaught Exception ");
    process.exit(1);
})

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,

})

export const instance = new Razorpay({
    key_id : process.env.RAZORPAY_API_KEY,
    key_secret : process.env.RAZORPAY_API_SECRET
})

connectDB();

const port = process.env.PORT
const server = app.listen(port ,()=>{
    console.log(`Server is working on ${port} in ${process.env.node_env} mode`);
})

//unhandled Promise Rejection
process.on("unhandledRejection",(err)=>{
    console.log(`err : ${err.message}`);
    console.log("shutting down the server due to unhandled promise rejection");

    server.close(()=>{
        process.exit(1);
    })
})

