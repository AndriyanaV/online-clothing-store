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
productRouter.get("/get-all-products-by-filter", getAllProducts);
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
productRouter.use("/protected/admin-only", verifyRoleMiddleware(UserRole.admin));
//Alloewd routes for admin
productRouter.post("/protected/admin-only/add-product-basic-info", addProductBasicInfo);
productRouter.post(
  "/protected/admin-only/add-product-variation-info",
  addProductVariationInfo
);
productRouter.post("/protected/admin-only/add-tags-to-product/:productId", addTagsToProduct);
productRouter.post(
  "/protected/admin-only/add-variation-size/:productId/:variationId",
  addVariationSize
);

//CLOUDINARY
productRouter.post(
  "/protected/admin-only/add-product-variation-image/:productId/:variationId",
  addColorAndNameToReqBody,
  addProductVariationPicsCloudinary
);

//Routes to update product and variant info (without image)
productRouter.put(
  "/protected/admin-only/protected/update-product-basic-info/:productId",
  updateProductBasicInfo
);
productRouter.put(
  "/protected/admin-only/update-product-variant-info/:variantId",
  updateProductVariantInfo
);

//CLOUDINARY
productRouter.put(
  "/protected/admin-only/update-product-variant-image/:productId/:variationId",
  addColorAndNameToReqBody,
  updateProductVariationPicsCloudinary
);

productRouter.get(
  "/protected/admin-only/get-product-variant-by-sku/:sku",
  getProductVariantBySku
);
productRouter.get(
  "/protected/admin-only/return-available-tags-for-product/:productId",
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
  "/protected/admin-only/get-available-colors-for-product/:productId",
  getAvailableColorsForProductVariation
);

// Soft Delete Product
productRouter.patch(
  "/protected/admin-only/soft-delete-product/:productId",
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
