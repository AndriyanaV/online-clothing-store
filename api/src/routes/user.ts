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
userRouter.put("/updateUser/:userId", updateUser);
userRouter.get("/getUser/:userId", getUser);

//Authorization
//Here the middleware only applies to routes starting with /protected.
userRouter.use("/protected", verifyRoleMiddleware(UserRole.admin));
// userRouter.use(verifyRoleMiddleware(UserRole.admin));
//Allowed routes
userRouter.put("/protected/changeRoleToAdmin/:userId", changdeRoleToAdmin);
userRouter.get("/protected/getUsers", getAllUsers);
userRouter.delete("/protected/deleteUser/:userId", deleteUser);

export default userRouter;
