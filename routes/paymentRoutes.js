import express from 'express'
import { paymentVerification, processPayment, sendRazorpayApiKey} from '../controllers/payment.js';
import { isAuthenticated } from '../middleWares/auth.js';


const router = express.Router();

router.post("/payment/process",isAuthenticated,processPayment);
router.get("/razorpayapikey",isAuthenticated,sendRazorpayApiKey);
router.post("/payment/verification",isAuthenticated,paymentVerification);

export default router;