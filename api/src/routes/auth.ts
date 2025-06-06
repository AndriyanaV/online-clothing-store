import express from 'express';
import { test, test2, register, login}  from  "../controllers/authController";
import authMiddleware from '../middleware/authMiddleware'; // Match the casing exactly


const authRouter = express.Router()

authRouter.post('/register', register);
authRouter.post('/login', login);


export default authRouter;