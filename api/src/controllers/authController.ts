import e, { NextFunction } from "express";
import { Request, Response } from "express";
import { ApiResponse } from "../types/common";
import {
  LoginBody,
  LoginResponse,
  RegistrationResponse,
  ResetPasswordBody,
  VerifyEmailAgainBody,
} from "../types/auth";
import RegistrationBody from "../types/auth";
import { validateRequestWithZod } from "../middleware/validateRequestMiddleware";
import { registerSchemaRules } from "../schemas/auth/registerRequest";
import { User } from "../models/user";
import { createErrorJson, createSuccessJson } from "../utils/responseWrapper";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
  HASH_SALT,
  jwtLoginExpiresInTime,
  jwtLoginExpiresInTimeRememberMe,
  jwtResetPasswordExpiresInTime,
} from "../constants/common";
import { loginSchemaRules } from "../schemas/auth/logiinRequest";
import { role } from "../constants/user";
import { randomUUID } from "crypto";
import { sendEmail } from "../services/externals/emailService";
import { verifyEmailBodySchema } from "../schemas/auth/VerifyEmailBody";
import { resetPasswordBodySchema } from "../schemas/auth/resetPassword";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
interface ResetPasswordJWTPayload {
  userId: string;
  email: string;
}

// /auth/register
// Register user and get data for login
export const register = [
  validateRequestWithZod(registerSchemaRules), // assuming validation rules are correctly defined
  async (
    req: Request<{}, {}, RegistrationBody>,
    res: Response<ApiResponse<RegistrationResponse>>
  ) => {
    // console.log({req});

    const email = req.body.email;
    const password = req.body.password;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "register", msg: "BE_user_already_exists" },
            ])
          );
        return;
      }

      const hashedPassword = await bcrypt.hash(password, HASH_SALT);

      // Generating verification token
      const verificationToken = randomUUID();

      const newUser = new User({
        email,
        password: hashedPassword,
        firstName: req.body.firstName ? req.body.firstName : "",
        lastName: req.body.lastName ? req.body.firstName : "",
        role: role.user,
        verificationToken: verificationToken,
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verifiedEmail: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await newUser.save();

      // The email body for verification token:
      const emailBody = `
                <h1>Welcome!</h1>
                <p>Thank you for registering on our platform.</p>
                <p>To verify your email address, please click the link below:</p>
                <p>
                    <a href="${
                      process.env.FRONTEND_HOST
                    }/en/EmailVerification?token=${encodeURIComponent(
        verificationToken
      )}">
                        Verify your email
                    </a>
                </p>
                <p>Best regards</p>
           `;

      await sendEmail(email, "Welcome", "", emailBody);

      // Create token for login user on registration
      const expiresIn = jwtLoginExpiresInTime;

      const token = jwt.sign(
        { email: newUser.email, id: newUser._id },
        JWT_SECRET,
        { expiresIn }
      );

      const userId = newUser._id.toString();

      const { password: _, _id: s, ...addedUser } = newUser.toObject();

      const publicUser = {
        _id: userId,
        ...addedUser,
      };

      const response: RegistrationResponse = {
        token: token,
        user: publicUser,
      };

      res
        .status(201)
        .json(
          createSuccessJson<RegistrationResponse>(
            "BE_user_registered_successfully",
            response
          )
        );
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
    }
  },
];

export const test = [
  validateRequestWithZod(registerSchemaRules),
  async (
    req: Request<{}, {}, RegistrationBody>,
    res: Response<
      {
        radi: string;
      },
      {}
    >
  ) => {
    console.log(req);

    const email = req.body?.email || "";
    const password = req.body?.password || "";

    const hashedPassword = password;

    const newUser = new User({
      password: hashedPassword,
      firstName: req.body.firstName || "",
      lastName: req.body.lastName || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    newUser.email = email;

    console.log({ newUser });

    await newUser.save();

    res.json({ radi: "user" });

    return;
  },
];

export async function test2(req: any, res: any) {
  return res.send("123");
}

//Login
export const login = [
  validateRequestWithZod(loginSchemaRules),

  async (
    req: Request<{}, {}, LoginBody>,
    res: Response<ApiResponse<LoginResponse | null>>
  ) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        res
          .status(400)
          .json(createErrorJson([{ type: "login", msg: "BE_user_not_exist" }]));
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        res
          .status(400)
          .json(
            createErrorJson([{ type: "login", msg: "BE_invalid_password" }])
          );
        return;
      }

      const expiresIn = jwtLoginExpiresInTime;

      const userId = user._id.toString();

      const { password: _, _id: __v, ...rest } = user.toObject();

      const publicUser = { _id: userId, ...rest };

      const token = jwt.sign({ email: user.email, id: userId }, JWT_SECRET, {
        expiresIn,
      });

      const response: LoginResponse = {
        token: token,
        user: publicUser,
      };

      res
        .status(200)
        .json(createSuccessJson("BE_user_login_successfully", response));
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

//Email verification
export const emailVerification = async (
  req: Request<{}, {}, {}, { token: string }>,
  res: Response
) => {
  const token = req.query.token;
  if (!token) {
    res
      .status(400)
      .json(
        createErrorJson([
          { type: "email-verification", msg: "BE_invalid_token" },
        ])
      );
    return;
  }

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user || user?.verificationTokenExpires < new Date()) {
      res
        .status(404)
        .json(
          createErrorJson([
            { type: "email-verification", msg: "BE_invalid_token" },
          ])
        );
      return;
    }

    // Verify the user's email
    user.verificationToken = "";
    user.verifiedEmail = true;

    await user.save();

    res
      .status(200)
      .json(createSuccessJson("BE_email_verification_success", {}));
    return;
  } catch (error) {
    console.error("Error verifying email:", error);
    res
      .status(400)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

//Send verification email token again
export const sendVerificationTokenAgain = [
  validateRequestWithZod(verifyEmailBodySchema),
  async (req: Request<{}, {}, VerifyEmailAgainBody>, res: Response) => {
    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        res
          .status(400)
          .json(createErrorJson([{ type: "login", msg: "BE_user_not_exist" }]));
        return;
      }

      if (user.verifiedEmail) {
        res.status(400).json({ msg: "Email already verified" });
        return;
      }

      // Generating verification token
      const verificationToken = randomUUID();

      user.verificationToken = verificationToken;
      user.verificationTokenExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

      await user.save();

      // The email body for verification token:
      const emailBody = `
                <h1>Welcome!</h1>
                <p>Thank you for registering on our platform.</p>
                <p>To verify your email address, please click the link below:</p>
                <p>
                    <a href="${
                      process.env.FRONTEND_HOST
                    }/en/EmailVerification?token=${encodeURIComponent(
        verificationToken
      )}">
                        Verify your email
                    </a>
                </p>
                <p>Best regards</p>
           `;

      await sendEmail(req.body.email, "Welcome", "", emailBody);
      res
        .status(200)
        .json(createSuccessJson("BE_verify_profile_email_email_success", {}));
      return;
    } catch (error) {
      console.error("Error verifying email:", error);
      res
        .status(400)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

//Send reset password request
export const resetPasswordRequest = async (
  req: Request<{}, {}, {}, { email: string }>,
  res: Response
) => {
  const email = req.query.email;
  if (!email) {
    res
      .status(400)
      .json(createErrorJson([{ type: "general", msg: "BE_email_not_sended" }]));
  }

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      res
        .status(400)
        .json(createErrorJson([{ type: "login", msg: "BE_user_not_exist" }]));
      return;
    }

    //Create reset password token
    const resetPasswordToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      }, // Payload data
      JWT_SECRET, // Secret key
      { expiresIn: jwtResetPasswordExpiresInTime } // Token expires in 15 mins
    );

    user.resetPasswordToken = resetPasswordToken;
    await user.save();

    const emailBody = `
            <h1>Reset Your Password</h1>
            <p>We received a request to reset your password. You can reset your password by clicking the link below:</p>
            <p>
                <a href="${
                  process.env.FRONTEND_HOST
                }/en/ResetPassword?token=${encodeURIComponent(
      resetPasswordToken
    )}">
                    Reset Password
                </a>
            </p>
            <p>If you did not request this, please ignore this email.</p>
            <p>Best regards/p>
            `;
    await sendEmail(email, "Reset password", "", emailBody);

    res
      .status(200)
      .json(createSuccessJson("BE_reset_password_link_success", {}));
    return;
  } catch (error) {
    console.error("Error for password request:", error);
    res
      .status(400)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

//Reset password
export const resetPassword = [
  validateRequestWithZod(resetPasswordBodySchema),
  async (req: Request<{}, {}, ResetPasswordBody>, res: Response) => {
    try {
      const { token, password } = req.body;

      const decoded = jwt.verify(
        token,
        JWT_SECRET
      ) as ResetPasswordJWTPayload | null;

      if (!decoded || !decoded.userId || !decoded.email) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "reset-password", msg: "BE_invalid_token" },
            ])
          );
        return;
      }

      const user = await User.findOne({ resetPasswordToken: token });
      if (!user) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "reset-password", msg: "BE_invalid_token" },
            ])
          );
        return;
      }

      // Save the new password
      const hashedPassword = await bcrypt.hash(password, HASH_SALT);
      user.password = hashedPassword;

      // Remove the forgotPasswordToken - to avoid to use more than once
      user.resetPasswordToken = "";

      await user.save();

      res.status(201).json(createSuccessJson("BE_reset_password_success", {}));
      return;
    } catch (error) {
      console.error("Error for password reset:", error);
      res
        .status(400)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];
