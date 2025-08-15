import { Types } from "mongoose";

export interface Category {
  _id?: Types.ObjectId;
  name: string;
  isMainCategory: boolean;
  subcategories?: Array<Types.ObjectId>;
  description: string;
  categoryImageUrl: string;
  isActive: boolean;
}

export interface SubCategory {
  _id?: Types.ObjectId;
  name: string;
  isMainCategory: string;
  description: string;
  categoryImageUrl: string;
  subcategories?: Category[];
}

export interface CategoryDto extends Omit<Category, "_id"> {
  _id: string;
}

export interface CategoryInfo
  extends Pick<Category, "name" | "description" | "categoryImageUrl"> {
  _id: string;
}

export interface SubCategoryInfo extends Pick<CategoryInfo, "description"> {}

export interface SubcategoriesInfo
  extends Pick<
    CategoryDto,
    "_id" | "name" | "description" | "categoryImageUrl"
  > {}

export interface CategoryWithPopulatedSubs
  extends Omit<
    Pick<CategoryDto, "_id" | "name" | "description" | "subcategories">,
    "subcategories"
  > {
  subcategories: SubcategoriesInfo[];
}

export interface UpdateMainCategoryDto
  extends Partial<
    Omit<
      Category,
      "_id" | "categoryImageUrl" | "isMainCategory" | "subcategories"
    >
  > {}

export interface UpdateSubcategoryDto
  extends Partial<
    Omit<
      Category,
      "_id" | "categoryImageUrl" | "isMainCategory" | "subcategories"
    >
  > {}

export interface AddMainCategoryDto
  extends Omit<
    Category,
    "_id" | "categoryImageUrl" | "isMainCategory" | "subcategories"
  > {}

export interface AddSubcategoryDto
  extends Omit<
    Category,
    "_id" | "categoryImageUrl" | "isMainCategory" | "subcategories"
  > {}

export interface AddedCategoryInfo extends Pick<CategoryDto, "_id" | "name"> {}
