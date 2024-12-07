import ErrorHandler from "../middleWares/error.js";
import Product from "../models/product.js";
import {asyncHandler} from '../middleWares/AsyncErr.js'
import Order from '../models/order.js';

export const newOrder = asyncHandler(async(req,res,next)=>{
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      } = req.body;
     const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paidAt:Date.now(),
        user:req.user._id,
     })
     res.status(200).json({
        success:true,
        message:"Placed Order"
     })

})

export const getSingleOrder = asyncHandler(async(req,res,next)=>{
    const order = await Order.findById(req.params.id).populate(
        "user",
        "name email"
    )
    if(!order){
        return next(new ErrorHandler("order not found",404));
    }
    res.status(200).json({
        success:true,
        order
    })
    
})

export const myOrders = asyncHandler(async(req,res,next)=>{
  try {
    console.log("User:", req.user);
    const orders = await Order.find({user:req.user._id});
    console.log(orders);
    res.status(200).json({
        success:true,
        orders
    })  
  } catch (error) {
    return next(new ErrorHandler("orders not found",404));
  }
})
//for admin
export const getAllOrders = asyncHandler(async(req,res,next)=>{
    const orders = await Order.find();

    let totalAmount = 0;
    orders.forEach((i)=>{
        totalAmount += i.totalPrice;
    })
    res.status(200).json({
        success:true,
        totalAmount,
        orders,
        
    }) 
})

export const updateOrder = asyncHandler(async(req,res,next)=>{
    const order = await Order.findById(req.params.id);
    if(!order){
        return next(new ErrorHandler("order not found",404));
    }

    if(order.orderStatus === 'Delivered'){
        return next(new ErrorHandler('You have already delivered this order',400));
    }
    if(req.body.status === "shipped"){
        order.orderItems.forEach(async(o)=>{
            await updateStock(o.product,o.quantity);
        })
    }
   order.orderStatus = req.body.status;
   if(req.body.status === 'Delivered'){
    order.deliveredAt = Date.now();
   }
   await order.save({validateBeforeSave : false});
   res.status(200).json({
    success:true
   })
})

async function updateStock(id,quantity){
    const product = await Product.findById(id);
    product.stock = product.stock - quantity;
    await product.save({validateBeforeSave:false});
}
//admin
export const deleteOrder = asyncHandler(async (req, res, next) => {
    try {
    const order = await Order.findOneAndDelete({ _id: req.params.id });
    if (!order) return next(new ErrorHandler("Order not found", 404));
  
    res.status(200).json({ success: true });
    } catch (err) {
    return next(new ErrorHandler("Server Error", 500));
  }
  });
