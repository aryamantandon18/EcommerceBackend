import ErrorHandler from "../middleWares/error.js";
import Product from "../models/product.js";
import {asyncHandler} from '../middleWares/AsyncErr.js'
import ApiFeatures from "../utils/apiFeatures.js";
import cloudinary from 'cloudinary';

export const newProduct = asyncHandler(async(req,res,next)=>{
  let images = [];
  if(typeof req.body.images == 'string'){
   images.push(req.body.images);
  }else{
   images = req.body.images;
  }
  const imagesLinks=[];
  for(let i=0;i<images.length;i++){
   const result = await cloudinary.v2.uploader.upload(images[i],{
      folder:"products",
   });

   imagesLinks.push({
      public_id: result.public_id,
      url:result.secure_url,
   })
  }
  req.body.images = imagesLinks;
//   -----------------------------------------------------------------------------
   req.body.user = req.user.id;
   const product = await Product.create(req.body);
   res.status(201).json({
      success:true,
      product,
   })

});
//Get All products for Admin
export const getAdminProducts = asyncHandler(async(req,res,next)=>{
 const products = await Product.find();
    res.status(200).json({
        success:true,
        products,
     })
});

export const getAllProducts = asyncHandler(async(req,res,next)=>{
   // return next(new ErrorHandler("This is an error message",404));
   const resultPerPage = 4;
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

export const updateProduct = asyncHandler(async(req,res,next)=>{
   let product  = await Product.findById(req.params.id);
   if(!product){
      return next(new ErrorHandler("Product not found",404));
   }
   product = await Product.findByIdAndUpdate(req.params.id,req.body,{
      new:true,
      runValidators: true,
      useFindAndModify:false

   });
   res.status(200).json({
      success:true,
      message:"product updated",
      product
   })
      
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
         