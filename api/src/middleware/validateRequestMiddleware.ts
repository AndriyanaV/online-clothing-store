import { Request, Response, NextFunction } from "express";
import { createErrorJson } from "../utils/responseWrapper";
import { z, ZodError } from "zod";
import { ApiError } from "../types/common";

export const validateRequestWithZod = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate
      const parsedBody = schema.parse(req.body);
      // Replace request body with parsed body
      // Because of security
      req.body = parsedBody;
      // console.log({ nb })
      next(); // Ako je validacija uspešna, nastavi dalje
    } catch (error) {
      // Check if error is zod error
      if (error instanceof ZodError) {
        // Ako je greška tipa ZodError, vrati validacione greške
        const zodErrors: Array<ApiError> = error.errors.map((err) => ({
          msg: err.message,
          type: "validation_error",
          path: err.path,
          code: err.code,
        }));
        res.status(400).json(createErrorJson(zodErrors));
      }
      // Some another error
      else {
        res.status(500).json({
          message: "An unexpected error occurred",
        });
      }
    }
  };
};
