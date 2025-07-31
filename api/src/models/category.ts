import mongoose from "mongoose";
import { Category } from "../types/category";
import { boolean } from "zod";

const Schema = mongoose.Schema;

export const CATEGORY_KEY = "Category";

const CategorySchema = new Schema<Category>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    isMainCategory: { type: Boolean, default: false },
    subcategories: [
      { type: mongoose.Types.ObjectId, ref: CATEGORY_KEY, default: [] },
    ],
    categoryImageUrl: { type: String },
  },
  { timestamps: true }
);

const Category = mongoose.model(CATEGORY_KEY, CategorySchema);

export { Category };
