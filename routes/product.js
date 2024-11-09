import express from 'express'
import { createProductReview, deleteProduct, deleteReviews, getAdminProducts, getAllProducts, getAllReviews, getProductById, getReviewsByUserId, newProduct, updateProduct } from '../controllers/product.js';
import { authorizeRole, isAuthenticated } from '../middleWares/auth.js';

const router = express.Router();

router.get("/products",getAllProducts);
router.get("/admin/products",isAuthenticated,authorizeRole("Admin"),getAdminProducts);
router.post("/admin/product/new",isAuthenticated,authorizeRole("Admin"),newProduct);
router.route("/admin/product/:id")
.put(isAuthenticated,authorizeRole("Admin"),updateProduct)
.delete(isAuthenticated,authorizeRole("Admin"),deleteProduct)

router.get("/product/:id",getProductById);
router.route("/product/review").put(isAuthenticated,createProductReview);
router.route("/product/reviews")
.get(getAllReviews)
.delete(isAuthenticated,deleteReviews);

router.get("/getReviewsForUser/:userId",isAuthenticated,getReviewsByUserId);

export default router