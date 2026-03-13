import express, { Router } from "express";
import {
  addCategoryImage,
  addMainCategoryInfo,
  addSubCategoryImageCloudinary,
  addSubcategoryInfo,
  getCategory,
  getMainCategories,
  getMainCategoriesAdmin,
  getSubcategoriesOfMainCategory,
  getSubcategoriesOfMainCategoryAdmin,
  softDeleteCategory,
  updateCategoryImage,
  updateMainCategoryInfo,
  updateSubcategory,
  updateSubCategoryImageCloudinary,
} from "../controllers/categoryController";
import authMiddleware from "../middleware/authMiddleware";
import verifyRoleMiddleware from "../middleware/verifyRoleMiddleware";
import { UserRole } from "../constants/user";
import addCategoryAndSubcatNameToReqBody from "../middleware/addCateogryAndSubcatNameToReqBodt";
import addCategoryNameToReqBody from "../middleware/addCategoryNameToReqBody";

const categoryRouter = express.Router();

//Routes for user
categoryRouter.get("/get-main-categories", getMainCategories);
categoryRouter.get(
  "/get-subcategories-of-main-category/:categoryId",
  getSubcategoriesOfMainCategory
);
categoryRouter.get("/get-category/:categoryId", getCategory);

//ADMIN
//Authentication
categoryRouter.use(authMiddleware);
//Authorization - admin can access routes that starts with admin-only
categoryRouter.use("/protected/admin-only", verifyRoleMiddleware(UserRole.admin));
//Allowed routes
categoryRouter.post("/protected/admin-only/add-main-category-info", addMainCategoryInfo);
categoryRouter.post(
  "/protected/admin-only/add-subcategory-info/:categoryId",
  addSubcategoryInfo
);

//Admin can see inactive categories also
categoryRouter.get("/protected/admin-only/get-main-categories-admin", getMainCategoriesAdmin);
categoryRouter.get(
  "/protected/admin-only/get-subcategories-of-main-category-admin/:categoryId",
  getSubcategoriesOfMainCategoryAdmin
);

categoryRouter.put(
  "/protected/admin-only/update-main-category-info/:categoryId",
  updateMainCategoryInfo
);
categoryRouter.put(
  "/protected/admin-only/update-subcategory-main-info/:subcategoryId",
  updateSubcategory
);

//CLOUDIANRY - ADD AND UPDATE CATEGORY IMAGE
categoryRouter.post(
  "/protected/admin-only/add-category-image-on-cloud/:categoryId",
  addCategoryNameToReqBody,
  addCategoryImage
);
categoryRouter.put(
  "/protected/admin-only/update-category-image/:categoryId",
  addCategoryNameToReqBody,
  updateCategoryImage
);

//SUBCATEGORY ADD AND UPDATE IMAGE- CLOUDINARY
categoryRouter.post(
  "/protected/admin-only/add-subcategory-image/:categoryId/:subcategoryId",
  addCategoryAndSubcatNameToReqBody,
  addSubCategoryImageCloudinary
);

categoryRouter.put(
  "/protected/admin-only/update-subcategory-image/:categoryId/:subcategoryId",
  addCategoryAndSubcatNameToReqBody,
  updateSubCategoryImageCloudinary
);

//Soft delete by changing status
categoryRouter.patch(
  "/protected/admin-only/soft-delete-category/:categoryId",
  softDeleteCategory
);

//For the local upload - works

// categoryRouter.post(
//   "/addCategoryImage/:categoryId",
//   addCateogryNameToReqBody,
//   addCategoryImage
// );

// categoryRouter.post(
//   "/addSubcategoryImage/:categoryId/:subcategoryId",
//   addCateogryAndSubcatNameToReqBody,
//   addSubCategoryImage
// );

//Update Subcategory Image- Local Upload
// categoryRouter.put(
//   "/updateSubcateogryImage/:categoryId/:subcategoryId",
//   addCateogryAndSubcatNameToReqBody,
//   updateSubCategoryImage
// );

//Local Upload - Works
// categoryRouter.put(
//   "/updateCategoryImage/:categoryId",
//   addCateogryNameToReqBody,
//   updateCategoryImage
// );

export default categoryRouter;
