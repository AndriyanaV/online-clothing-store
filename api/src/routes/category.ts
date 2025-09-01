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
  updateSubCategoryImageCloudinary,
} from "../controllers/categoryController";
import addCateogryNameToReqBody from "../middleware/addCategoryNameToReqBody";
import addCateogryAndSubcatNameToReqBody from "../middleware/addCateogryAndSubcatNameToReqBodt";

const categoryRouter = express.Router();

categoryRouter.post("/addMainCategoryInfo", addMainCategoryInfo);
categoryRouter.post("/addSubcategoryInfo/:categoryId", addSubcategoryInfo);

//Local upload- Route works
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

// categoryRouter.post('/addCategory',addCategory);
categoryRouter.get("/getMainCategories", getMainCategories);
categoryRouter.get(
  "/getSubcategoriesOfMainCategory/:categoryId",
  getSubcategoriesOfMainCategory
);
categoryRouter.get("/getMainCategoriesAdmin", getMainCategoriesAdmin);
categoryRouter.get(
  "/getSubcategoriesOfMainCategoryAdmin/:categoryId",
  getSubcategoriesOfMainCategoryAdmin
);
categoryRouter.get("/getCategory/:categoryId", getCategory);

//Local Upload - Works
// categoryRouter.put(
//   "/updateCategoryImage/:categoryId",
//   addCateogryNameToReqBody,
//   updateCategoryImage
// );

categoryRouter.put(
  "/updateMainCategoryInfo/:categoryId",
  updateMainCategoryInfo
);

//Update Subcategory Image- Local Upload
// categoryRouter.put(
//   "/updateSubcateogryImage/:categoryId/:subcategoryId",
//   addCateogryAndSubcatNameToReqBody,
//   updateSubCategoryImage
// );

//Not real delte just set isActive to false
categoryRouter.patch("/deleteCategory/:categoryId", softDeleteCategory);

//CLOUDIANRY - ADD AND UPDATE CATEGORY IMAGE
categoryRouter.post(
  "/addCategoryImageOnCloud/:categoryId",
  addCateogryNameToReqBody,
  addCategoryImage
);
categoryRouter.put(
  "/updateCategoryImage/:categoryId",
  addCateogryNameToReqBody,
  updateCategoryImage
);

//SUBCATEGORY ADD AND UPDATE IMAGE- CLOUDINARY
categoryRouter.put(
  "/updateSubcateogryImage/:categoryId/:subcategoryId",
  addCateogryAndSubcatNameToReqBody,
  updateSubCategoryImageCloudinary
);

categoryRouter.put(
  "/addSubcategoryImage/:categoryId/:subcategoryId",
  addCateogryAndSubcatNameToReqBody,
  addSubCategoryImageCloudinary
);

export default categoryRouter;
