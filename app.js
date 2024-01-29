import express from 'express';
import userRouter from'./routes/user.js'
import productRouter from './routes/product.js'
import {config} from 'dotenv'
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { errorMiddleWare } from './middleWares/error.js';
import orderRouter from './routes/order.js'
import paymentRouter from './routes/paymentRoutes.js'
// import { fileURLToPath } from 'url';
// import path from 'path';

// // Resolve __dirname using import.meta.url
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export const app = express();
import cors from 'cors'
import fileUpload from 'express-fileupload';

config({
    path:"./data/config.env",
});

//using middleware
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({extended:true,limit: '30mb'}))
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true,limit: '30mb' })); // so that we can access data from req.body 
app.use(fileUpload());
app.use(cors({
    origin:[process.env.frontend_uri],                // Specify the allowed origins
    method:["GET",'POST','PUT','DELETE'],                // Specify the allowed HTTP methods
    credentials:true,       // Allow credentials (e.g., cookies) to be sent             
}))

app.use("/users",userRouter);
app.use(productRouter);
app.use(orderRouter);
app.use(paymentRouter);

// app.use(express.static(path.join(__dirname,'../client/build')));
// app.get('*',(req,res)=>{
//     res.sendFile(path.resolve(__dirname,'../client/build'));
// });

app.get("/",(req,res)=>{
    res.send("Nice Working"); 
})
app.use(errorMiddleWare);








// put the dynamic route at the last bcoz JS(express) code is executed from top to bottom 
// /users/:id  is a dynamic url
// /users/asdf  here id is asdf
// console.log(req.params)  -> {id : 'asdf'}

//  app.get("/userid",async(req,res)=>{
//     const {id} = req.query;
//     const user = await Users.findById(id);
//     res.json({
//         success:"True",
//         user
//     })
// })
