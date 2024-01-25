import express from 'express'
const router = express.Router();
import { authorizeRole, isAuthenticated } from '../middleWares/auth.js';
import { deleteOrder, getAllOrders, getSingleOrder, myOrders, newOrder, updateOrder } from '../controllers/order.js';

router.post("/order/new",isAuthenticated,newOrder);
router.get("/order/me",isAuthenticated,myOrders);
router.get("/order/:id",isAuthenticated,getSingleOrder);
router.get("/admin/orders",isAuthenticated,authorizeRole("admin"),getAllOrders);
router.route("/admin/order/:id")
.put(isAuthenticated,authorizeRole("admin"),updateOrder)
.delete(isAuthenticated,authorizeRole("admin"),deleteOrder);

export default router