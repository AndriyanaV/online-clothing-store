import express, { Router } from "express";
import {
  addProductBasicInfo,
  addProductVariationInfo,
  addProductVariationPics,
  updateProductBasicInfo,
  updateProductVariantInfo,
  updateProductVariationPics,
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

//Routes to update variant info and image
productRouter.put("/updateProductBasicInfo/:productId", updateProductBasicInfo);
productRouter.put(
  "/updateProductVariantInfo/:variantId",
  updateProductVariantInfo
);
productRouter.put(
  "/updateProductVariationPics/:productId/:variationId",
  addColorAndNameToReqBody,
  updateProductVariationPics
);

export default productRouter;
