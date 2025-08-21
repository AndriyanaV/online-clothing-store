import { ProductVariant } from "../models/productVariant";
import { Request, Response, NextFunction } from "express";
import { createErrorJson } from "../utils/responseWrapper";
import { Product } from "../models/product";
import { ApiResponse } from "../types/common";
import { validateRequestWithZod } from "./validateRequestMiddleware";
import { variationIdsSchema } from "../schemas/product/checkIdsOfAddedProducts";

const addColorAndNameToReqBody = [
  async (
    req: Request<{ variationId: string; productId: string }, {}, any>,
    res: Response<ApiResponse<null>>,
    next: NextFunction
  ) => {
    try {
      const variation = await ProductVariant.findOne({
        _id: req.params.variationId,
        product_id: req.params.productId,
      });

      if (!variation) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addVariationImg", msg: "variation_not_found" },
            ])
          );
        return;
      }

      const product = await Product.findOne({ _id: req.params.productId });

      if (!product) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addVariationImg", msg: "product_not_found" },
            ])
          );
        return;
      }

      req.customData = {
        variationColor: variation.color,
        product_id: product._id,
        productName: product.name,
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

export default addColorAndNameToReqBody;
