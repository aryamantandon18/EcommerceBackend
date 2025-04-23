import express from 'express';
import userRouter from'./routes/user.js'
import productRouter from './routes/product.js'
import {config} from 'dotenv'
import cookieParser from 'cookie-parser';
import ErrorHandler, { errorMiddleWare } from './middleWares/error.js';
import orderRouter from './routes/order.js'
import paymentRouter from './routes/paymentRoutes.js'
import helmet from 'helmet'; // Adds security-related HTTP headers
import rateLimit from 'express-rate-limit'; // Rate-limiting middleware
import cors from 'cors'
import compression from 'compression';  //This will enable GZIP which makes your HTTP responses smaller.

export const app = express();
config({
    path:"./data/config.env",
});

//using middleware
app.use(helmet());

// Rate limiting to prevent brute-force attacks
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
  });
app.use(limiter);
  
app.use(express.json({ limit: '50mb' }));    // Stores the parsed data in req.body. alternative- app.use(bodyParser)
app.use(express.urlencoded({extended:true, limit: '50mb' })) //alternative - app.use(bodyParser.urlencoded({extended:true,limit: '50mb'}));
app.use(cookieParser());
app.use(compression());

app.use(cors({
    origin: ["https://aryaman-ecommerce.vercel.app", "http://localhost:3000"],       // Specify the allowed origins
    method:["GET",'POST','PUT','DELETE'],                // Specify the allowed HTTP methods
    credentials: true,       // Allow credentials (e.g., cookies) to be sent             
}))

app.use("/users",userRouter);
app.use(productRouter);
app.use(orderRouter);
app.use(paymentRouter);

app.get("/",(req,res)=>{
    res.send(`Hello from Express Server ${process.pid}`); 
})
app.use(errorMiddleWare);

app.all('*',(req,res,next)=>{
 return next(new ErrorHandler(`Can't find ${req.originalUrl} on the server!`,404))
})































// import { fileURLToPath } from 'url';
// import path from 'path';

// Resolve __dirname using import.meta.url
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// __dirname -> it is the current directory name 
// app.use(express.static(path.join(__dirname,'../client/build')));
// app.get('*',(req,res)=>{
//     res.sendFile(path.resolve(__dirname,'../client/build'));
// });

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
