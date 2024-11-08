// import ErrorHandler from "../middleWares/error.js";
// import Product from "../models/product.js";
// import { asyncHandler } from '../middleWares/AsyncErr.js';
// import Order from '../models/order.js';
// import { redisClient } from "../server.js";

// // Create a new order and clear relevant caches
// export const newOrder = asyncHandler(async (req, res, next) => {
//     const {
//         shippingInfo,
//         orderItems,
//         paymentInfo,
//         itemsPrice,
//         taxPrice,
//         shippingPrice,
//         totalPrice,
//     } = req.body;

//     const order = await Order.create({
//         shippingInfo,
//         orderItems,
//         paymentInfo,
//         itemsPrice,
//         taxPrice,
//         shippingPrice,
//         totalPrice,
//         paidAt: Date.now(),
//         user: req.user._id,
//     });

//     // Clear cache related to user and admin orders
//     await redisClient.del(`/order/me`);
//     await redisClient.del(`/admin/orders`);

//     res.status(200).json({
//         success: true,
//         message: "Placed Order"
//     });
// });

// // Get a single order
// export const getSingleOrder = asyncHandler(async (req, res, next) => {
//     const orderId = req.params.id;
//     const order = await Order.findById(orderId).populate("user", "name email");

//     if (!order) {
//         return next(new ErrorHandler("order not found", 404));
//     }

//     // Cache the response
//     await redisClient.setex(`/order/${orderId}`, 3600, JSON.stringify(order)); // Cache for 1 hour

//     res.status(200).json({
//         success: true,
//         order
//     });
// });

// // Get all orders for a specific user
// export const myOrders = asyncHandler(async (req, res, next) => {
//     const userId = req.user._id;
//     const orders = await Order.find({ user: userId });

//     // Cache the response
//     await redisClient.setex(`/order/me`, 3600, JSON.stringify(orders)); // Cache for 1 hour

//     res.status(200).json({
//         success: true,
//         orders
//     });
// });

// // Admin: Get all orders
// export const getAllOrders = asyncHandler(async (req, res, next) => {
//     const orders = await Order.find();
//     let totalAmount = 0;

//     orders.forEach((i) => {
//         totalAmount += i.totalPrice;
//     });

//     // Cache the response
//     await redisClient.setex(`/admin/orders`, 3600, JSON.stringify({ totalAmount, orders })); // Cache for 1 hour

//     res.status(200).json({
//         success: true,
//         totalAmount,
//         orders
//     });
// });

// // Update order status and clear relevant cache
// export const updateOrder = asyncHandler(async (req, res, next) => {
//     const order = await Order.findById(req.params.id);
//     if (!order) {
//         return next(new ErrorHandler("order not found", 404));
//     }

//     if (order.orderStatus === 'Delivered') {
//         return next(new ErrorHandler('You have already delivered this order', 400));
//     }

//     if (req.body.status === "shipped") {
//         order.orderItems.forEach(async (o) => {
//             await updateStock(o.product, o.quantity);
//         });
//     }
    
//     order.orderStatus = req.body.status;
//     if (req.body.status === 'Delivered') {
//         order.deliveredAt = Date.now();
//     }
//     await order.save({ validateBeforeSave: false });

//     // Clear cache for the updated order and related orders list
//     await redisClient.del(`/order/${req.params.id}`);
//     await redisClient.del(`/order/me`);
//     await redisClient.del(`/admin/orders`);

//     res.status(200).json({
//         success: true
//     });
// });

// async function updateStock(id, quantity) {
//     const product = await Product.findById(id);
//     product.stock = product.stock - quantity;
//     await product.save({ validateBeforeSave: false });
// }

// // Admin: Delete order and clear relevant cache
// export const deleteOrder = asyncHandler(async (req, res, next) => {
//     const orderId = req.params.id;
    
//     Order.findOneAndDelete(orderId, async (err) => {
//         if (err) {
//             return next(new ErrorHandler("order not found", 404));
//         }

//         // Clear cache for deleted order and related orders list
//         await redisClient.del(`/order/${orderId}`);
//         await redisClient.del(`/order/me`);
//         await redisClient.del(`/admin/orders`);
        
//         res.status(200).json({
//             success: true
//         });
//     });
// });

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
export const deleteOrder = asyncHandler(async(req,res,next)=>{
    Order.findOneAndDelete(req.params.id,(err)=>{
     if(err){
        return next(new ErrorHandler("order not found",404));
     }
    })
    res.status(200).json({
        success:true
    })
})
