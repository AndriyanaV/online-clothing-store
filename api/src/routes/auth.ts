import express from "express";
import {
  register,
  login,
  emailVerification,
  sendVerificationTokenAgain,
  resetPassword,
  resetPasswordRequest,
} from "../controllers/authController";
import authMiddleware from "../middleware/authMiddleware";

const authRouter = express.Router();

//Login and register routes
authRouter.post("/register", register);
authRouter.post("/login", login);

//Regiter user verification routes
authRouter.post("/email-verification", emailVerification);
authRouter.post("/sendVerificationTokenAgain", sendVerificationTokenAgain);

//Reset password
authRouter.post("/resetPasswordRequest", resetPasswordRequest);
authRouter.post("/resetPassword", resetPassword);

export default authRouter;
