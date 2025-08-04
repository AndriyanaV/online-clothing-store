import express, { Router } from "express";
import {
  addProductBasicInfo,
  addProductVariationInfo,
  addProductVariationPics,
  updateProductBasicInfo,
  updateProductVariantInfo,
} from "../controllers/productController";
import addColorAndNameToReqBody from "../middleware/addColorAndNameToReqBody";

const productRouter = express.Router();

productRouter.post("/addProductBasicInfo", addProductBasicInfo);
productRouter.post("/addProductVariationInfo", addProductVariationInfo);
productRouter.post(
  "/addProductVariationPics/:productId/:variationId",
  addColorAndNameToReqBody,
  addProductVariationPics
);
productRouter.put("/updateProductBasicInfo/:productId", updateProductBasicInfo);
productRouter.put(
  "/updateProductVariantInfo/:variantId",
  updateProductVariantInfo
);

export default productRouter;
