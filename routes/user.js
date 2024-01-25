import express from 'express'
import { Login, deleteUser, forgotPassword, getAllUsers, getMyProfile, getUserById, logout, register, updatePassword, updateProfile, updateRole ,resetPassword} from '../controllers/user.js';
import { authorizeRole, isAuthenticated } from '../middleWares/auth.js';

 const router = express.Router();
 
router.post("/new",register);
router.post("/login",Login);
router.get("/me",isAuthenticated,getMyProfile);
router.post("/password/forgot",forgotPassword); 
router.route("/password/reset/:token").put(resetPassword);
router.get("/logout",logout);
router.put("/password/update",isAuthenticated,updatePassword);
router.put("/me/update",isAuthenticated,updateProfile);

router.get("/admin/users",isAuthenticated,authorizeRole("admin"),getAllUsers);

router.route("/admin/user/:id")
.get(isAuthenticated,authorizeRole("admin"),getUserById)
.put(isAuthenticated,authorizeRole("admin"),updateRole)
.delete(isAuthenticated,authorizeRole("admin"),deleteUser)




 export default router;


 // router.route("/userid/:Id").get(getUserDatails).put(updateUser).delete(deleteUser);
// router.get("/userid/:Id",getUserDatails);
// router.put("/userid/:Id",updateUser);
// router.delete("/userid/:Id",deleteUser);