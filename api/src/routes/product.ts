import express, { Router } from "express";
import {
  addProductBasicInfo,
  addProductVariationInfo,
  addProductVariationPicsCloudinary,
  addTagsToProduct,
  addVariationSize,
  getAllProducts,
  getAvailableColorsForProductVariation,
  getProductVariantBySku,
  returnavailableTagsForProduct,
  softDeleteProduct,
  updateProductBasicInfo,
  updateProductVariantInfo,
  updateProductVariationPicsCloudinary,
} from "../controllers/productController";
import addColorAndNameToReqBody from "../middleware/addColorAndNameToReqBody";
import authMiddleware from "../middleware/authMiddleware";
import verifyRoleMiddleware from "../middleware/verifyRoleMiddleware";
import { UserRole } from "../constants/user";

const productRouter = express.Router();

//USER
//Get
productRouter.get("/getAllproducts", getAllProducts);
// productRouter.get("/getProduct/:productId", getProduct);
// productRouter.get("/getProductsByTag/:tag", getProductsByTag);
// productRouter.get(
//   "/getAllproductsBySubcategoryWithFilters/:subcategoryId",
//   getAllproductsBySubcategoryWithFilters
// );

//ADMIN
//Authentication
productRouter.use(authMiddleware);
//Authorization
productRouter.use("/protected", verifyRoleMiddleware(UserRole.admin));
//Alloewd routes for admin
productRouter.post("/protected/addProductBasicInfo", addProductBasicInfo);
productRouter.post(
  "/protected/addProductVariationInfo",
  addProductVariationInfo
);
productRouter.post("/protected/addTagsToProduct/:productId", addTagsToProduct);
productRouter.post(
  "/protected/addVariationSize/:productId/:variationId",
  addVariationSize
);

//CLOUDINARY
productRouter.post(
  "/protected/addProductVariationPicsCloudinary/:productId/:variationId",
  addColorAndNameToReqBody,
  addProductVariationPicsCloudinary
);

//Routes to update product and variant info (without image)
productRouter.put(
  "/protected/protected/updateProductBasicInfo/:productId",
  updateProductBasicInfo
);
productRouter.put(
  "/protected/protected/updateProductVariantInfo/:variantId",
  updateProductVariantInfo
);

//CLOUDINARY
productRouter.put(
  "/protected/updateProductVariationPicsCloudinary/:productId/:variationId",
  addColorAndNameToReqBody,
  updateProductVariationPicsCloudinary
);

productRouter.get(
  "/protected/protected/getProductVariantBySku/:sku",
  getProductVariantBySku
);
productRouter.get(
  "/protected/returnavailableTagsForProduct/:productId",
  returnavailableTagsForProduct
);

//Admin can see inactive also and more fields
// productRouter.get(
//   "/protected/getProductWithAllVariations/:productId",
//   getProductWithAllVariations
// );
// productRouter.get(
//   "/protected/getAllproductsBySubcategoryAdmin/:subcategoryId",
//   getAllproductsBySubcategoryAdmin
// );
productRouter.get(
  "/protected/getAvailableColorsForProductVariation/:productId",
  getAvailableColorsForProductVariation
);

// Soft Delete Product
productRouter.patch(
  "/protected/softDeleteProduct/:productId",
  softDeleteProduct
);

export default productRouter;

//For Local Upload
// productRouter.post(
//   "/addProductVariationPics/:productId/:variationId",
//   addColorAndNameToReqBody,
//   addProductVariationPics
// );

// productRouter.put(
//   "/updateProductVariationPics/:productId/:variationId",
//   addColorAndNameToReqBody,
//   updateProductVariationPics
// );
