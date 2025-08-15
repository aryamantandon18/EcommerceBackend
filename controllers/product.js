import ErrorHandler from "../middleWares/error.js";
import Product from "../models/product.js";
import {asyncHandler} from '../middleWares/AsyncErr.js'
import ApiFeatures from "../utils/apiFeatures.js";
import cloudinary from 'cloudinary';
import { Readable } from "stream";
import mongoose from "mongoose";

export const newProduct = asyncHandler(async (req, res) => {
  try {
    // Step 1: Parse the form data (using multer or any file upload middleware)
    console.log("Body -",req.body);
    console.log("Files - ",req.files);
    const { name, description, price, category,stock } = req.body;
    if(!name || !description || !price || !category || !stock){
      return res.status(400).json({
        success:false,
        message:"All fields are required",
      })
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

export const getAllProducts = asyncHandler(async(req,res)=>{
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

export const getProductsForSearchbar = asyncHandler(async(req,res)=>{
  const keyword = req.query.keyword;
  if(!keyword) return res.json([]);

  const products = await Product.find({
    name:{$regex:keyword , $options:'i'}
  }).limit(10).select('name');

  res.status(200).json({
    success:true,
    products:products.map(p=> p.name),
  })
})



export const updateProduct = asyncHandler(async (req, res, next) => {
   try {
     let product = await Product.findById(req.params.id);

     if (!product) {
       return next(new ErrorHandler("Product not found", 404));
     }
 
     const images = Array.isArray(req.files?.images) ? req.files.images : [req.files?.images].filter(Boolean);
     const videos = Array.isArray(req.files?.videos) ? req.files.videos : [req.files?.videos].filter(Boolean);
 
     if (images.length > 0 && product.images?.length) {
      for (let image of product.images) {
        try {
          await cloudinary.v2.uploader.destroy(image.public_id, { resource_type: "image" });
        } catch (error) {
          console.error("Error deleting old image:", error);
        }
      }
    }

    // Step 4: Delete old videos from Cloudinary
    if (videos.length > 0) {
      for (let video of product.videos) {
        try {
          await cloudinary.v2.uploader.destroy(video.public_id, { resource_type: "video" });
        } catch (error) {
          console.error("Error deleting old video:", error);
        }
      }
    }
    const imageLinks = await Promise.all(
      images.map((image) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.v2.uploader.upload_stream(
            { folder: `ecmm/products/images/${product._id}`, resource_type: "image" },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve({ public_id: result.public_id, url: result.secure_url });
              }
            }
          );
          const bufferStream = new Readable();
          bufferStream.push(image.buffer);
          bufferStream.push(null); // End of stream
          bufferStream.pipe(uploadStream);
        });
      })
    );

    // Step 6: Upload new videos to Cloudinary
    const videoLinks = await Promise.all(
      videos.map((video, index) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.v2.uploader.upload_stream(
            { folder: `ecmm/products/videos/${product._id}`, resource_type: "video", public_id: `video_${index + 1}` },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve({ public_id: result.public_id, src: result.secure_url });
              }
            }
          );
          const bufferStream = new Readable();
          bufferStream.push(video.buffer);
          bufferStream.push(null); // End of stream
          bufferStream.pipe(uploadStream);
        });
      })
    );

    // Step 7: Update product details
    const updatedData = {
      ...req.body,
      images: imageLinks.length > 0 ? imageLinks : product.images,
      videos: videoLinks.length > 0 ? videoLinks : product.videos,
    };

    product = await Product.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    // Step 8: Send response
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
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
       
       await Product.findByIdAndDelete(req.params.id);

       res.status(200).json({
         success:true,
         message : 'Product Deleted '
        })
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


//admin reviews
export const getAllReviewsForAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Pagination from query params
  const { username, rating, productId } = req.body; // Filters from the request body

  try {
    // Input validation
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    if (isNaN(pageNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number',
      });
    }
    if (isNaN(limitNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit value',
      });
    }

    // Calculate skip value for pagination
    const skip = (pageNumber - 1) * limitNumber;

    // Build dynamic filter for the reviews
    const matchFilter = {};

    // Filter by productId if provided
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid productId',
        });
      }
      matchFilter['_id'] = new mongoose.Types.ObjectId(productId); // Filter by product ID
    }

    // Filter by username in the reviewer's name (case-insensitive)
    if (username) {
      matchFilter['reviews.name'] = { $regex: username, $options: 'i' }; // Case-insensitive search
    }

    // Filter by rating if provided
    if (rating) {
      const ratingNumber = parseInt(rating);
      if (isNaN(ratingNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid rating value',
        });
      }
      matchFilter['reviews.rating'] = ratingNumber; // Filter by review rating
    }

    // Aggregation pipeline to get reviews with the provided filters
    const reviews = await Product.aggregate([
      { $unwind: '$reviews' }, // Unwind the reviews array to treat each review as an individual document
      { $match: matchFilter }, // Apply the dynamic filter here
      {
        $lookup: {
          from: 'users', // Join with users collection to get reviewer details
          localField: 'reviews.user',
          foreignField: '_id',
          as: 'reviewer',
        },
      },
      {
        $unwind: {
          path: '$reviewer',
          preserveNullAndEmptyArrays: true, // Handle products without reviews
        },
      },
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
          date: '$reviews.createdAt',
          reviewName: '$reviews.name',
        },
      },
      { $sort: { date: -1 } }, // Sort by review creation date (descending)
      { $skip: skip }, // Skip for pagination
      { $limit: limitNumber }, // Limit results per page
    ]);

    // Get total reviews count
    const totalReviewsCount = await Product.aggregate([
      { $unwind: '$reviews' },
      { $match: matchFilter }, // Apply the same filter for the total count
      { $count: 'totalReviews' }, // Get the total count
    ]);

    const totalReviews = totalReviewsCount.length > 0 ? totalReviewsCount[0].totalReviews : 0;
    const totalPages = Math.ceil(totalReviews / limitNumber); // Calculate total pages

    // If no reviews found, return 404
    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No reviews found with the provided filters',
      });
    }

    // Return the reviews along with pagination info
    return res.status(200).json({
      success: true,
      reviews,
      totalReviews,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    console.error('Error fetching reviews', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
});

export const deleteReviewForAdmin = asyncHandler(async (req, res) => {
  try {
    const reviewId = req.params.id; 
    const result = await Product.updateMany(
      { 'reviews._id': new mongoose.Types.ObjectId(reviewId) }, // Cast the reviewId to ObjectId
      { $pull: { reviews: { _id: new mongoose.Types.ObjectId(reviewId) } } } // Pull the review from the array
    );
    if (result.nModified === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or already deleted',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
});

export const editReviewForAdmin = asyncHandler(async(req,res) => {
  try {
    const reviewId = req.params.id;
    const {rating,comment} = req.body;
    console.log("Line 463 ",req.body);

    if(!rating && !comment){
      return res.status(400).json({
        success:false,
        message:"At least one field (rating or comment) is required to update the review"
      })
    }

    const result = await Product.updateOne(
      {'review._id': new mongoose.Types.ObjectId(reviewId)},
      {
        $set:{
          'review.$.rating': rating,
          'review.$.comment':comment,
        }
      }
    )

    console.log("Line 482 ",result);

    if(result.nModified === 0){
      return res.status(404).json({
        success: false,
        message: 'Review not found or no changes made',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
    });
  } catch (error) {
    console.error('Error updating review', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
})







