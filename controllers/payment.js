
import {asyncHandler} from '../middleWares/AsyncErr.js'
import ErrorHandler from "../middleWares/error.js";
import { instance } from '../server.js';

export const processPayment = asyncHandler(async(req,res,next)=>{
  try {
    const myPayment = await instance.orders.create({
        amount:req.body.amount,             // amount in paise (50000 paise = ₹500)
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

export const paymentVerification = asyncHandler(async(req,res,next)=>{
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