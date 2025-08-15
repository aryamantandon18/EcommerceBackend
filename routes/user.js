import express from 'express'
import { Login, deleteUser, forgotPassword, getAllUsers, getMyProfile, getUserById, logout, register, updatePassword, updateProfile, updateRole ,resetPassword} from '../controllers/user.js';
import { sendBulkEmail } from '../controllers/emailController.js';
import { authorizeRole, isAuthenticated } from '../middleWares/auth.js';
import multer from 'multer';

 const router = express.Router();

 const storage = multer.memoryStorage() // Using memoryStorage so file can be uploaded directly to Cloudinary
 const upload = multer({ storage: storage });
 
router.post("/new",upload.single("avatar"),register);
router.post("/login",Login);
router.get("/me",isAuthenticated,getMyProfile);
router.post("/password/forgot",forgotPassword); 
router.route("/password/reset/:token").put(resetPassword);
router.get("/logout",logout);
router.put("/password/update",isAuthenticated,updatePassword);
router.put("/me/update",isAuthenticated,updateProfile);

router.get("/admin/users",isAuthenticated,authorizeRole("Admin"),getAllUsers);

router.route("/admin/user/:id")
.get(isAuthenticated,authorizeRole("Admin"),getUserById)
.put(isAuthenticated,authorizeRole("Admin"),updateRole)
.delete(isAuthenticated,authorizeRole("Admin"),deleteUser)


router.post('/send-bulk-email', sendBulkEmail);


 export default router;


 // router.route("/userid/:Id").get(getUserDatails).put(updateUser).delete(deleteUser);
// router.get("/userid/:Id",getUserDatails);
// router.put("/userid/:Id",updateUser);
// router.delete("/userid/:Id",deleteUser);