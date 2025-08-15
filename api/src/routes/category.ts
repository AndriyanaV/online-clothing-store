import express, { Router } from "express";
import {
  deleteCategory,
  getCategory,
  getMainCategories,
  getSubcategoriesOfMainCategory,
  updateCategoryImage,
} from "../controllers/categoryController";

const categoryRouter = express.Router();

// categoryRouter.post('/addCategory',addCategory);
categoryRouter.get("/getMainCategories", getMainCategories);
categoryRouter.get(
  "/getSubcategoriesOfMainCategory/:categoryId",
  getSubcategoriesOfMainCategory
);
// categoryRouter.put("/updateCategory/:categoryId", updateMainCategory);
categoryRouter.put("/updateCategoryImage/:categoryId", updateCategoryImage);
categoryRouter.get("/getCategory/:categoryId", getCategory);
categoryRouter.delete("/deleteCategory/:categoryId", deleteCategory);

export default categoryRouter;
