import express from 'express'
import { createProductReview, deleteProduct, deleteReviewForAdmin, deleteReviews, getAdminProducts, getAllProducts, getAllReviews, getAllReviewsForAdmin, getFeaturedProducts, getProductById, getReviewsByUserId, newProduct, updateProduct } from '../controllers/product.js';
import { authorizeRole, isAuthenticated } from '../middleWares/auth.js';
import multer from 'multer';
// import fs from 'fs';

const router = express.Router();

// const uploadFolder = 'uploads/';

// // Create the folder if it doesn't exist
// if (!fs.existsSync(uploadFolder)) {
//   fs.mkdirSync(uploadFolder);
// }
// // Set up storage for multer
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, uploadFolder); // Specify the uploads folder
//     },
//     filename: (req, file, cb) => {
//       cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
//     },
//   });
const storage = multer.memoryStorage(); 
  const upload = multer({storage,limits: { fileSize: 50 * 1024 * 1024 }});
  const uploadFields = upload.fields([
    { name: 'images', maxCount: 10 },   // Adjust maxCount based on your requirements
    { name: 'videos', maxCount: 3 },
  ]);

  

router.get("/products",getAllProducts);
router.get("/products/featuredProducts",getFeaturedProducts);
router.get("/admin/products",isAuthenticated,authorizeRole("Admin"),getAdminProducts);

router.post("/admin/product/new",isAuthenticated,authorizeRole("Admin"),
  (req,res,next)=>{
    console.log("Line 39 ",req.files);
    console.log("Line 40 ",req.body);
    next();
  }
,uploadFields,newProduct);

router.route("/admin/product/:id")
.put(isAuthenticated,authorizeRole("Admin"),updateProduct)
.delete(isAuthenticated,authorizeRole("Admin"),deleteProduct)

router.get("/product/:id",getProductById);
// router.route("/product/review").put(isAuthenticated,createProductReview);
// router.route("/product/reviews")
// .get(getAllReviews)
// .delete(isAuthenticated,deleteReviews);
router.get("/getReviewsForUser/:userId", isAuthenticated, getReviewsByUserId);
router.post("/admin/reviews",isAuthenticated,getAllReviewsForAdmin);
router.delete("/admin/review/:id",isAuthenticated,deleteReviewForAdmin);
  

export default router