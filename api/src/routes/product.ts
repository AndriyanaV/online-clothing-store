import express, { Router } from "express";
import {
  addProductBasicInfo,
  addProductVariationInfo,
  addProductVariationPics,
  addTagsToProduct,
  addVariationSize,
  deleteProduct,
  deleteProductVariation,
  getAllproductsBySubcategory,
  getAllproductsBySubcategoryAdmin,
  getAllproductsBySubcategoryWithFilters,
  getAvailableColorsForProductVariationasync,
  getProduct,
  getProductsByTag,
  getProductVariantBySku,
  getProductWithAllVariations,
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
productRouter.post(
  "/addVariationSize/:productId/:variationId",
  addVariationSize
);

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
productRouter.get("/getProductsByTag/:tag", getProductsByTag);
productRouter.get(
  "/getProductWithAllVariations/:productId",
  getProductWithAllVariations
);
productRouter.get(
  "/getAllproductsBySubcategoryAdmin/:subcategoryId",
  getAllproductsBySubcategoryAdmin
);
productRouter.get(
  "/getAvailableColorsForProductVariationasync/:productId",
  getAvailableColorsForProductVariationasync
);
productRouter.get(
  "/getAllproductsBySubcategoryWithFilters/:subcategoryId",
  getAllproductsBySubcategoryWithFilters
);

// Delete Routes
productRouter.delete("/deleteProduct/:productId", deleteProduct);
productRouter.delete(
  "/deleteProductVariation/variationId",
  deleteProductVariation
);
