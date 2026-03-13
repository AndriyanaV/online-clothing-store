import express from "express";
import {
  changdeRoleToAdmin,
  updateUser,
  getAllUsers,
  getUser,
  deleteUser,
} from "../controllers/userController";
import authMiddleware from "../middleware/authMiddleware";
import verifyRoleMiddleware from "../middleware/verifyRoleMiddleware";
import { User } from "../models/user";
import { UserRole } from "../constants/user";

const userRouter = express.Router();

// Authentication
userRouter.use(authMiddleware);
// router.get('/protected/me', me)
//Allowed routes
userRouter.put("/update-user/:userId", updateUser);
userRouter.get("/get-user/:userId", getUser);

//Authorization
//Here the middleware only applies to routes starting with /protected.
userRouter.use("/protected/admin-only", verifyRoleMiddleware(UserRole.admin));
// userRouter.use(verifyRoleMiddleware(UserRole.admin));
//Allowed routes
userRouter.put("/protected/admin-only/change-role-to-admin/:userId", changdeRoleToAdmin);
userRouter.get("/protected/admin-only/get-users", getAllUsers);
userRouter.delete("/protected/admin-only/detete-user/:userId", deleteUser);

export default userRouter;
