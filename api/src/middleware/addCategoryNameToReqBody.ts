import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types/common";
import { Category } from "../models/category";
import { createErrorJson } from "../utils/responseWrapper";

const addCateogryNameToReqBody = [
  async (
    req: Request<{ categoryId: string }, {}, any>,
    res: Response<ApiResponse<null>>,
    next: NextFunction
  ) => {
    try {
      const category = await Category.findOne({ _id: req.params.categoryId });

      if (!category) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addCategoryImg", msg: "category_not_found" },
            ])
          );
        return;
      }

      req.customData = {
        cateogory_name: category.name,
      };

      next();
    } catch (error) {
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

export default addCateogryNameToReqBody;
