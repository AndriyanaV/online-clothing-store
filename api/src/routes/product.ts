import express, { Router } from "express";
import {
  addProductBasicInfo,
  addProductVariationInfo,
  addProductVariationPics,
  addTagsToProduct,
  getAllproductsBySubcategory,
  getProduct,
  getProductVariantBySku,
  returnavailableTagsForProduct,
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
productRouter.post("/addTagsToProduct/:productId", addTagsToProduct);

//Routes to update product and variant info and image
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

//Get
productRouter.get(
  "/getAllproductsBySubcategory/:subcategoryId",
  getAllproductsBySubcategory
);
productRouter.get("/getProduct/:productId", getProduct);
export default productRouter;
productRouter.get("/getProductVariantBySku/:sku", getProductVariantBySku);
productRouter.get(
  "/returnavailableTagsForProduct/:productId",
  returnavailableTagsForProduct
);
