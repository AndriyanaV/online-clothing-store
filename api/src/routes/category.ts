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
categoryRouter.get("/getMainCategories", getMainCategories);
categoryRouter.get(
  "/getSubcategoriesOfMainCategory/:categoryId",
  getSubcategoriesOfMainCategory
);
categoryRouter.get("/getCategory/:categoryId", getCategory);

//ADMIN
//Authentication
categoryRouter.use(authMiddleware);
//Authorization
categoryRouter.use("/protected", verifyRoleMiddleware(UserRole.admin));
//Allowed routes
categoryRouter.post("/protected/addMainCategoryInfo", addMainCategoryInfo);
categoryRouter.post(
  "/protected/addSubcategoryInfo/:categoryId",
  addSubcategoryInfo
);

//Admin can see inactive categories also
categoryRouter.get("/protected/getMainCategoriesAdmin", getMainCategoriesAdmin);
categoryRouter.get(
  "/protected/getSubcategoriesOfMainCategoryAdmin/:categoryId",
  getSubcategoriesOfMainCategoryAdmin
);

categoryRouter.put(
  "/protected/updateMainCategoryInfo/:categoryId",
  updateMainCategoryInfo
);
categoryRouter.put(
  "/protected/updateSubcategoryMainInfo/:subcategoryId",
  updateSubcategory
);

//CLOUDIANRY - ADD AND UPDATE CATEGORY IMAGE
categoryRouter.post(
  "/protected/addCategoryImageOnCloud/:categoryId",
  addCategoryNameToReqBody,
  addCategoryImage
);
categoryRouter.put(
  "/protected/updateCategoryImage/:categoryId",
  addCategoryNameToReqBody,
  updateCategoryImage
);

//SUBCATEGORY ADD AND UPDATE IMAGE- CLOUDINARY
categoryRouter.post(
  "/protected/addSubcategoryImage/:categoryId/:subcategoryId",
  addCategoryAndSubcatNameToReqBody,
  addSubCategoryImageCloudinary
);

categoryRouter.put(
  "/protected/updateSubcateogryImage/:categoryId/:subcategoryId",
  addCategoryAndSubcatNameToReqBody,
  updateSubCategoryImageCloudinary
);

//Soft delete by changing status
categoryRouter.patch(
  "/protected/deleteCategory/:categoryId",
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
