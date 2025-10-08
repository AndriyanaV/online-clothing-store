import { createErrorJson } from "../utils/responseWrapper";
import { IUserPayload } from "../types/auth";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user";
import { UserRole } from "../constants/user";

const JWT_SECRET = "your_jwt_secret";

const verifyRoleMiddleware = (...allowedRoles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res
        .status(403)
        .json(
          createErrorJson([
            { type: "auth", msg: "BE_access_denied_token_not_provided" },
          ])
        );
      return;
    }
    try {
      const decodedData = jwt.verify(token, JWT_SECRET) as IUserPayload;
      const userEmail = decodedData.email;

      const user = await User.findOne({ email: userEmail });

      if (!user) {
        res
          .status(403)
          .json(createErrorJson([{ type: "auth", msg: "BE_access_denied" }]));
        return;
      }

      if (!user.role || !allowedRoles.includes(user.role)) {
        res
          .status(403)
          .json(createErrorJson([{ type: "auth", msg: "BE_access_denied" }]));
        return;
      }

      next();
    } catch {
      res
        .status(401)
        .json(createErrorJson([{ type: "auth", msg: "session_expired" }]));
    }
  };
};

export default verifyRoleMiddleware;
