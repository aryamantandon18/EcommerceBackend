import express from 'express'
import { createProductReview, deleteProduct,deleteReviewForAdmin,editReviewForAdmin,getAdminProducts, getAllProducts, getAllReviewsForAdmin, getFeaturedProducts, getProductById,getProductsForSearchbar,newProduct, updateProduct } from '../controllers/product.js';
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
router.get("/products/suggestions",getProductsForSearchbar);
router.get("/products/featuredProducts",getFeaturedProducts);
router.route("/product/review").put(isAuthenticated,createProductReview);
router.get("/admin/products",isAuthenticated,authorizeRole("Admin"),getAdminProducts);

router.post("/admin/product/new",isAuthenticated,authorizeRole("Admin"),uploadFields,newProduct);

router.route("/admin/product/:id")
.put(isAuthenticated,authorizeRole("Admin"),uploadFields,updateProduct)
.delete(isAuthenticated,authorizeRole("Admin"),deleteProduct)

router.get("/product/:id",getProductById);
router.post("/admin/reviews",isAuthenticated,getAllReviewsForAdmin);
router.route("/admin/review/:id")
.delete(isAuthenticated,deleteReviewForAdmin)
.put(isAuthenticated,editReviewForAdmin);
  

export default router





// router.route("/product/reviews")
// .get(getAllReviews)
// .delete(isAuthenticated,deleteReviews);