import ErrorHandler from "../middleWares/error.js";
import Product from "../models/product.js";
import {asyncHandler} from '../middleWares/AsyncErr.js'
import ApiFeatures from "../utils/apiFeatures.js";
import cloudinary from 'cloudinary';
import fs from 'fs';
import { Readable } from "stream";

export const newProduct = asyncHandler(async (req, res) => {
  try {
    // Step 1: Parse the form data (using multer or any file upload middleware)
    console.log("Body -",req.body);
    console.log("Files - ",req.files);
    const { name, description, price, category,stock } = req.body;
    if (!req.files || !req.files.images || !req.files.videos) {
      return res.status(400).json({ success: false, message: 'Please upload images and videos.' });
    }
    const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images].filter(Boolean);
    const videos = Array.isArray(req.files.videos) ? req.files.videos : [req.files.videos].filter(Boolean);

    // Step 2: Create the product instance
    const product = await Product.create({ name, description, price, category,stock });
    const productId = product._id;

    // if(typeof videos === "string"){ videos = [videos]}
 // Step 3: Upload images to Cloudinary
 const imageLinks = await Promise.all(
  images.map((image) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder: `ecmm/products/images/${productId}`, resource_type: 'image' },
        (error, result) => {
          if (error) {
            reject(error); // Reject if there's an error
          } else {
            resolve({ public_id: result.public_id, url: result.secure_url }); // Resolve with the result
          }
        }
      );
      const bufferStream = new Readable();
      bufferStream.push(image.buffer);
      bufferStream.push(null); // Indicate end of stream
      bufferStream.pipe(uploadStream);
    });
  })
);

// Step 4: Upload videos to Cloudinary
const videoLinks = await Promise.all(
  videos.map((video, index) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder: `ecmm/products/videos/${productId}`, resource_type: 'video', public_id: `video_${index + 1}` },
        (error, result) => {
          if (error) {
            reject(error); // Reject if there's an error
          } else {
            resolve({ public_id: result.public_id, src: result.secure_url }); // Resolve with the result
          }
        }
      );
      const bufferStream = new Readable();
      bufferStream.push(video.buffer);
      bufferStream.push(null); // Indicate end of stream
      bufferStream.pipe(uploadStream);
    });
  })
);

    // Step 5: Update the product with media links
    product.images = imageLinks;
    product.videos = videoLinks;
    await product.save();

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

//Get All products for Admin
export const getAdminProducts = asyncHandler(async(req,res,next)=>{
 const products = await Product.find();
 if(!products) return next(new ErrorHandler("Product not found",404));
    res.status(200).json({
        success:true,
        products,
     })
});

export const getFeaturedProducts = asyncHandler(async(req,res)=>{
  try {
    const featuredProducts = await Product.aggregate([
      { $sample: { size: 10 } }, // Randomly select 10 products
      {
          $project: {
              _id: 1,
              name: 1,
              price: 1,
              rating: 1,
              numOfReviews: 1,
              images: { $slice: ["$images", 1] } // Include only the first image
          },
      },
    ])

    res.status(200).json({success:true,products:featuredProducts});
  } catch (error) {
    console.error("Internal Server Error:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
})
export const getAllProducts = asyncHandler(async(req,res,next)=>{
   // return next(new ErrorHandler("This is an error message",404));
   const resultPerPage = 8;
   const productsCount = await Product.countDocuments();
   const apiFeature = new ApiFeatures(Product.find(), req.query)   // query , querystr
    .search()
    .filter()
    .pagination(resultPerPage)

  let products = await apiFeature.query;
    let filteredProductsCount = products.length;

   //  products = await apiFeature.query;
    res.status(200).json({
        success:true,
        message:"Here are all the users",
        products, 
        productsCount,
        resultPerPage,
        filteredProductsCount,
     })
});

export const updateProduct = asyncHandler(async (req, res, next) => {
   try {
     let product = await Product.findById(req.params.id);
     if (!product) {
       return next(new ErrorHandler("Product not found", 404));
     }
 
     let images = [];
     if (typeof req.body.images === 'string') {
       images.push(req.body.images);
     } else if (Array.isArray(req.body.images)) {
       images = req.body.images;
     }
 
     if (images.length > 0) {
       // Deleting old images from Cloudinary
       for (let i = 0; i < product.images.length; i++) {
         try {
           await cloudinary.v2.uploader.destroy(product.images[i].public_id);
         } catch (error) {
           console.error("Error deleting image:", error);
         }
       }
 
       const imagesLinks = [];
       for (let i = 0; i < images.length; i++) {
         try {
           if (typeof images[i] === 'string') {
             const result = await cloudinary.v2.uploader.upload(images[i], {
               folder: "products",
             });
             imagesLinks.push({
               public_id: result.public_id,
               url: result.secure_url,
             });
           } else {
             console.error("Invalid image format:", images[i]);
           }
         } catch (error) {
           console.error("Error uploading image:", error);
         }
       }
       req.body.images = imagesLinks;
     }
 
     product = await Product.findByIdAndUpdate(req.params.id, req.body, {
       new: true,
       runValidators: true,
       useFindAndModify: false,
     });
 
     res.status(200).json({
       success: true,
       message: "Product updated",
       product,
     });
   } catch (error) {
     console.error("Internal Server Error:", error);
     return next(new ErrorHandler("Internal Server Error", 500));
   }
 });
 
export const deleteProduct = asyncHandler(async (req, res) => {
   const product =  await Product.findById(req.params.id)
   if(product){
      //deleting images from cloudinary
      for (let i = 0; i < product.images.length; i++) {
         await cloudinary.v2.uploader.destroy(product.images[i].public_id);
       }
       
       await Product.findOneAndDelete(req.params.id);
       res.json({
         success:true,
         message : 'Product Removed'})
   } else{
      return next(new ErrorHandler("Product not found",404));
   }
})
 //getProductDetails
export const getProductById = asyncHandler(async (req, res,next) => {
   const product =  await Product.findById(req.params.id)
   if(product){
       res.json({
         success:true,
         product,
       })
   } else{
      return next(new ErrorHandler("Product not found",404));
   }
})

export const createProductReview = asyncHandler(async(req,res,next)=>{
   const{rating ,comment ,productId} = req.body;

   const review ={
      user:req.user._id,
      name:req.user.name,
      rating: Number(rating),
      comment,
   };

   const product = await Product.findById(productId); 

  const isReviewed = product.reviews.find((rev)=>
  { rev.user.toString() === req.user._id.toString() }
  );
   if(isReviewed){
  product.reviews.forEach((rev)=>{
   if(rev.user.toString() === req.user._id.toString() ){
      (rev.rating = rating),(rev.comment = comment)  ; }
  })
   }
   else{
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length
   }
   let avg = 0;

   product.reviews.forEach((rev) => {
      avg = avg + rev.rating;})

  product.rating= avg/product.reviews.length;

  await product.save({ validateBeforeSave: false });          // its very imp to pass validateBeforeSave option 
  res.status(200).json({
   success:true
  })
});

export const getAllReviews = asyncHandler(async(req,res,next)=>{

   const product = await Product.findById(req.query.productId);
   if(!product){
      return next(new ErrorHandler("Product not found",404));
   }
   res.status(200).json({
      success:true,
      reviews: product.reviews,
     })
})

export const deleteReviews = asyncHandler(async(req,res,next)=>{

   const product = await Product.findById(req.query.productId);
   if(!product){
      return next(new ErrorHandler("Product not found",404));
   }
   const reviews = product.reviews.filter(
      (rev) => rev._id.toString() !== req.query.id.toString()
    );

let avg = 0;

product.reviews.forEach((rev) => {
   avg = avg + rev.rating;
})

const newRating = avg/product.reviews.length;

const numOfReviews = product.reviews.length;

await Product.findByIdAndUpdate(req.query.productId,{
   reviews,
   rating : newRating,
   numOfReviews ,
},{ new:true,
   runValidators:true,
   useFindAndModify: false, })

   res.status(200).json({
      success:true,
     })
})

export const getReviewsByUserId = asyncHandler(async(req,res)=>{
  const {userId} = req.params;
  try {
    const reviews = await Product.aggregate([
      {
        $match:{'reviews.user' :  new mongoose.Types.ObjectId(userId)}
      },{
        $unwind: '$reviews'
      },{
        $match:{'reviews.user':  new mongoose.Types.ObjectId(userId)}
      },{
        $project:{
          productId:'$_id',
          reviews:'$reviews'
        }
      }
    ]);

    if(reviews.length === 0){
      return res.status(404).json({
        message:"No reviews for this user"
      })
    }

    return res.status(200).json(reviews)  

  } catch (error) {
    console.error("Line 270 in the productController",error);
    return res.status(500).json({message:"Internal Server Error"})
  }
});

export const getAllReviewsForAdmin = asyncHandler(async (req, res) => {
  const { page, limit } = req.query; 
  try {
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    const reviews = await Product.aggregate([
      // Match all products (you can add filters here if needed)
      {
        $match: {}
      },
      // Unwind the reviews array to separate each review as its own document
      {
        $unwind: '$reviews'
      },
      // Lookup to join user data with reviews
      {
        $lookup: {
          from: 'users', // The name of the users collection
          localField: 'reviews.user',
          foreignField: '_id',
          as: 'reviewer' // Alias for the joined user data
        }
      },
      // Unwind the user (reviewer) array to get each reviewer's details
      {
        $unwind: {
          path: '$reviewer',
          preserveNullAndEmptyArrays: true // Ensure null for products without reviews
        }
      },
      // Project only the necessary fields
      {
        $project: {
          productId: '$_id',
          productName: '$name',
          reviewId: '$reviews._id',
          userId: '$reviewer._id',
          userName: '$reviewer.name',
          userEmail: '$reviewer.email',
          rating: '$reviews.rating',
          comment: '$reviews.comment',
          date: '$reviews.createdAt'
        }
      },
      // Optional: Sort reviews by creation date (descending)
      {
        $sort: { 'reviews.createdAt': -1 }
      },
      // Skip the reviews that belong to previous pages
      {
        $skip: skip
      },
      // Limit the number of reviews per page
      {
        $limit: parseInt(limit)
      }
    ]);

    // Fetch the total count of reviews to calculate total pages
    const totalReviews = await Product.aggregate([
      { $unwind: '$reviews' },
      { $count: 'totalReviews' }
    ]);

    const totalReviewsCount = totalReviews.length > 0 ? totalReviews[0].totalReviews : 0;
    const totalPages = Math.ceil(totalReviewsCount / limit);

    // If no reviews are found, return a 404 error
    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No reviews found for any products'
      });
    }

    // Return the paginated reviews along with pagination info
    return res.status(200).json({
      success: true,
      reviews,
      totalReviews: totalReviewsCount,
      totalPages,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error in aggregation pipeline', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});

         