import express from "express";
import {changdeRoleToAdmin, updateUser, getAllUsers, getUser, deleteUser}  from  "../controllers/userController";
import authMiddleware from "../middleware/authMiddleware";

const userRouter = express.Router()

// userRouter.get('/me', me);
userRouter.put('/changeRoleToAdmin/:id', changdeRoleToAdmin);
userRouter.put('/updateUser/:userId', updateUser);

// userRouter.use(authMiddleware); 
userRouter.get('/getUsers', getAllUsers);
userRouter.get('/getUser/:userId', getUser);
userRouter.delete('/deleteUser/:userId', deleteUser);

// router.get('/protected/me', me)

export default userRouter