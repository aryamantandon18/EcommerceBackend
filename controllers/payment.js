
import {asyncHandler} from '../middleWares/AsyncErr.js'
import ErrorHandler from "../middleWares/error.js";
import { instance } from '../server.js';
import crypto from 'crypto';
import Order from '../models/order.js';

export const processPayment = asyncHandler(async(req,res,next)=>{
  try {
    const { amount } = req.body;
    // Validate the amount to ensure it's a positive number
    if (!amount || isNaN(amount) || amount <= 0) {
      return next(new ErrorHandler("Invalid payment amount", 400));
    }

    const myPayment = await instance.orders.create({
        amount:amount,             // amount in paise (50000 paise = ₹500)
        currency:"INR",
        notes:{
          company:"Ecommerce",
        }
    });
    res.status(200).json({
        success:true,
        myPayment,
    })
  } catch (error) {
    next(new ErrorHandler('Error processing payment',500))
    // console.log(error.message);
  }
})

export const sendRazorpayApiKey = asyncHandler(async(req,res,next)=>{
    res.status(200).json({
        razorpayApiKey:process.env.RAZORPAY_API_KEY
    })
})

export const paymentVerification_old = asyncHandler(async(req,res,next)=>{
  const { paymentId } = req.body;

  try {
    // Implement logic to verify payment
    // For example, you can use Razorpay API to fetch payment details
    const payment = await instance.payments.fetch(paymentId);

    // Check the payment status (adjust this based on your requirements)
    if (payment.status === 'captured'  || payment.status === 'authorized') {
      // Payment successful
      res.json({ status: 'success', message: 'Payment successful' });
    } else {
      // Payment failed or pending
      res.json({ status: 'failed', message: 'Payment failed or pending' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
})

export const paymentVerification = asyncHandler(async(req,res,next)=>{
  const {razorpay_order_id,razorpay_payment_id,razorpay_signature,amount,totalPrice} = req.body;
  console.log("Line 63 - ",req.body);
  if((amount/100) !== totalPrice){
    return res.status(400).json({success:false,message:"Amount missmatch"})
  }
  const generate_signature = crypto.createHmac('sha256',process.env.RAZORPAY_API_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest('hex')
  
  if(generate_signature === razorpay_signature){
    res.status(200).json({success:true,message:'Payment Verified Successfully'})
  }else{
    res.status(400).json({success:false,message:"Payment Verification Failed"})
  } 
})