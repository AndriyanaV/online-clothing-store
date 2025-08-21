import mongoose from "mongoose";
import { Request, Response } from "express";
import { ApiResponse } from "../types/common";
import { User, USER_KEY } from "../models/user";
import { createErrorJson, createSuccessJson } from "../utils/responseWrapper";
import { UserRole } from "../constants/user";
import { validateRequestWithZod } from "../middleware/validateRequestMiddleware";
import { updateUserBodySchema } from "../schemas/user/updateUser";
import {
  filterRole,
  PublicUser,
  UpdateUserBody,
  UserInfo,
} from "../types/user";
import { userInfo } from "os";
import authMiddleware from "../middleware/authMiddleware";

// export const me = async (req: Request, res: Response) => {
//     try {
//        console.log("sucess")
//        res.json({ message: 'User data fetched successfully nowwwwa' });

//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ error: 'Internal server error' });

//     }
// };

export const changdeRoleToAdmin = async (
  req: Request<{ userId: string }, {}, {}>,
  res: Response<ApiResponse<null>>
) => {
  try {
    const user = await User.findOne({ _id: req.params.userId });

    if (!user) {
      res
        .status(400)
        .json(
          createErrorJson([{ type: "updateRole", msg: "BE_user_not_exists" }])
        );
      return;
    }

    user.role = UserRole.admin;

    await user.save();

    res
      .status(200)
      .json(createSuccessJson("BE_role_sucessfully_updated_to_admin", null));
    return;
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

export const updateUser = [
  validateRequestWithZod(updateUserBodySchema),
  async (
    req: Request<{ userId: string }, {}, UpdateUserBody>,
    res: Response
  ) => {
    try {
      const user = await User.findOne({ _id: req.params.userId });

      if (!user) {
        res
          .status(400)
          .json(
            createErrorJson([{ type: "updateUser", msg: "BE_user_not_exists" }])
          );
        return;
      }

      const { firstName, lastName } = req.body;

      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;

      await user.save();

      res
        .status(200)
        .json(createSuccessJson("BE_user_updated_sucessfully", null));
      return;
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

export const getAllUsers = async (
  req: Request,
  res: Response<ApiResponse<PublicUser[]>>
) => {
  try {
    const { role } = req.query;

    const filter: filterRole = {};
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      filter.role = role as UserRole;
    }

    const users = await User.find(filter)
      .select(
        "-password -createdAt -updatedAt -verificationToken -verificationTokenExpires -resetPasswordToken -verifiedEmail "
      )
      .lean();

    const usersWithStringId = users.map((user) => ({
      ...user,
      _id: user._id.toString(),
    }));

    res
      .status(200)
      .json(createSuccessJson("BE_users_get_successfully", usersWithStringId));
    return;
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

export const getUser = async (
  req: Request<{ userId: string }>,
  res: Response<ApiResponse<PublicUser>>
) => {
  try {
    const user = await User.findOne({ _id: req.params.userId }).select(
      "-password -createdAt -updatedAt -verificationToken -verificationTokenExpires -resetPasswordToken -verifiedEmail"
    );

    if (!user) {
      res
        .status(400)
        .json(
          createErrorJson([{ type: "getUser", msg: "BE_user_not_exists" }])
        );
      return;
    }

    const { _id: v, ...rest } = user.toObject();

    const publicUser = {
      _id: user._id.toString(),
      ...rest,
    };

    res
      .status(200)
      .json(createSuccessJson("BE_user_get_successfully", publicUser));
    return;
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

export const deleteUser = async (
  req: Request<{ userId: string }, {}, {}>,
  res: Response<ApiResponse<null>>
) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.userId });

    if (!user) {
      res
        .status(400)
        .json(createErrorJson([{ type: "delete", msg: "BE_user_not_exists" }]));
      return;
    }

    res
      .status(200)
      .json(createSuccessJson("BE_users_deleted_successfully", null));
    return;
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};
