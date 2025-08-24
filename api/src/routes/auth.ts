import express from "express";
import {
  test,
  test2,
  register,
  login,
  emailVerification,
  sendVerificationTokenAgain,
  resetPassword,
  resetPasswordRequest,
} from "../controllers/authController";
import authMiddleware from "../middleware/authMiddleware";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);

//Regiter user verification routes
authRouter.post("/email-verification", emailVerification);
authRouter.post("/sendVerificationTokenAgain", sendVerificationTokenAgain);

//Reset password
authRouter.post("/resetPasswordRequest", resetPasswordRequest);
authRouter.post("/resetPassword", resetPassword);

export default authRouter;
