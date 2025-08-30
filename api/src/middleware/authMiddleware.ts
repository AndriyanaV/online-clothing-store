import { Request, Response, NextFunction } from "express";
import { createErrorJson } from "../utils/responseWrapper";
import jwt from "jsonwebtoken";
import { IUserPayload } from "../types/auth";

const JWT_SECRET = "your_jwt_secret";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
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

    const decodedData = jwt.verify(token, JWT_SECRET) as IUserPayload;

    req.customData = req.customData || {};

    req.customData.userId = decodedData?.id;
    req.customData.userEmail = decodedData?.email;

    next();
  } catch {
    res
      .status(401)
      .json(createErrorJson([{ type: "auth", msg: "session_expired" }]));
  }
};

export default authMiddleware;
