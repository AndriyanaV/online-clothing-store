import { validateRequestWithZod } from "../middleware/validateRequestMiddleware";
import { Category } from "../models/category";
import { addMainCategoryBodySchema } from "../schemas/category/addMainCategorySchema";
import { Request, Response } from "express";
import { createErrorJson, createSuccessJson } from "../utils/responseWrapper";
import { ApiResponse } from "../types/common";
import { uploadFiles } from "../middleware/uploadMilldeware";
import {
  UploadFilesOptions,
  UploadPath,
  UploadType,
} from "../types/uploadFiles";
import path from "path";
import {
  CategoryInfo,
  CategoryWithPopulatedSubs,
  SubCategoryInfo,
  SubCategory,
  CategoryDto,
  AddMainCategoryDto,
  AddedCategoryInfo,
  SubcategoriesInfo,
  UpdateMainCategoryDto,
  AddSubcategoryDto,
  UpdateSubcategoryDto,
} from "../types/category";
import { request } from "http";
import mongoose from "mongoose";
import fs from "fs";
import { validateRequestWithZodAndCleanFiles } from "../middleware/validateRequestWithZodAndCleanFiles";
import { updateMainCategoryBodySchema } from "../schemas/category/updateMainCateogrySchema";
import { addSubcategoryBodySchema } from "../schemas/category/addSubcategoriesSchema";
import { updateSubcategoryBodySchema } from "../schemas/category/updateSubcategorySchema";

// Podešavaš opcije za upload
const uploadOptions = {
  type: UploadType.SINGLE,
  uploadPath: UploadPath.CATEGORY,
  maxFileSize: 5 * 1024 * 1024, // npr 5MB
};

//Add cateogry  route - Add category basic info without image
export const addMainCategoryInfo = [
  validateRequestWithZod(addMainCategoryBodySchema),

  async (
    req: Request<{}, {}, AddMainCategoryDto>,
    res: Response<ApiResponse<AddedCategoryInfo>>
  ) => {
    try {
      const categoryName = await Category.findOne({ name: req.body.name });

      if (categoryName) {
        res
          .status(409)
          .json(
            createErrorJson([
              { type: "category", msg: "BE_category_name_alredy_exsist" },
            ])
          );
        return;
      }

      const categoryToAdd = new Category({
        name: req.body.name,
        description: req.body.description,
        isMainCategory: true,
        subcategories: [],
        isActive: req.body.isActive,
        parentCategory: null,
        categoryImageUrl: "",
      });

      await categoryToAdd.save();

      const addedMainCateogry: AddedCategoryInfo = {
        _id: categoryToAdd._id.toString(),
        name: categoryToAdd.name,
      };

      res
        .status(200)
        .json(
          createSuccessJson(
            "BE_main_category_sucessfully_added",
            addedMainCateogry
          )
        );
      return;
    } catch (error: any) {
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

//Add cateogry subcategory
export const addSubcategoryInfo = [
  validateRequestWithZod(addSubcategoryBodySchema),

  async (
    req: Request<{ categoryId: string }, {}, AddSubcategoryDto>,
    res: Response<ApiResponse<AddedCategoryInfo>>
  ) => {
    try {
      const category = await Category.findOne({
        _id: req.params.categoryId,
        isMainCategory: true,
      });

      if (!category) {
        res
          .status(409)
          .json(
            createErrorJson([
              { type: "category", msg: "BE_category_not_exsist" },
            ])
          );
        return;
      }

      const subExists = await Category.findOne({
        name: req.body.name,
        parentCategory: req.params.categoryId,
      });

      if (subExists) {
        res
          .status(409)
          .json(
            createErrorJson([
              { type: "category", msg: "BE_subcategory_already_exsist" },
            ])
          );
        return;
      }

      const subcategoryToAdd = new Category({
        name: req.body.name,
        description: req.body.description,
        isMainCategory: false,
        subcategories: [],
        isActive: req.body.isActive,
        parentCategory: req.params.categoryId,
        categoryImageUrl: "",
      });

      await subcategoryToAdd.save();

      category.subcategories?.push(subcategoryToAdd._id);

      await category.save();

      const addedMainCateogry: AddedCategoryInfo = {
        _id: subcategoryToAdd._id.toString(),
        name: subcategoryToAdd.name,
      };

      res
        .status(200)
        .json(
          createSuccessJson(
            "BE_subcategory_sucessfully_added",
            addedMainCateogry
          )
        );
      return;
    } catch (error: any) {
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

//Add category image
export const addCategoryImage = [
  uploadFiles(uploadOptions),

  async (
    req: Request<{ categoryId: string }, {}, {}>,
    res: Response<ApiResponse<null>>
  ) => {
    try {
      const category = await Category.findOne({ _id: req.params.categoryId });
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res
          .status(400)
          .json(
            createErrorJson([{ type: "addCategory", msg: "image_not_sended" }])
          );
        return;
      }

      if (!category) {
        const firstFile = files[0];
        const filePath = path.join(
          __dirname,
          "..",
          "..",
          "uploads",
          UploadPath.CATEGORY,
          firstFile.filename
        );

        try {
          await fs.promises.unlink(filePath);
          console.log(`Successfully deleted uploaded file: ${filePath}`);
        } catch (err) {
          console.error("Failed to delete uploaded file:", err);
        }

        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addCategory", msg: "category_not_found" },
            ])
          );
        return;
      }

      let imageUrl = null;
      const firstFile = files[0];

      const relativeFilePath = path
        .relative("uploads", firstFile.path)
        .replace(/\\/g, "/");
      imageUrl = relativeFilePath;

      category.categoryImageUrl = imageUrl;

      await category.save();
      res
        .status(200)
        .json(createSuccessJson("BE_category_image_sucessfully_added", null));
      return;
    } catch (error: any) {
      console.log(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

export const addSubCategoryImage = [
  uploadFiles(uploadOptions),

  async (
    req: Request<{ subcategoryId: string }, {}, {}>,
    res: Response<ApiResponse<null>>
  ) => {
    try {
      const subcategory = await Category.findOne({
        _id: req.params.subcategoryId,
      });
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res
          .status(400)
          .json(
            createErrorJson([{ type: "addCategory", msg: "image_not_sended" }])
          );
        return;
      }

      if (!subcategory) {
        const firstFile = files[0];
        const filePath = path.join(
          __dirname,
          "..",
          "..",
          "uploads",
          UploadPath.CATEGORY,
          firstFile.filename
        );

        try {
          await fs.promises.unlink(filePath);
          console.log(`Successfully deleted uploaded file: ${filePath}`);
        } catch (err) {
          console.error("Failed to delete uploaded file:", err);
        }

        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addCategory", msg: "category_not_found" },
            ])
          );
        return;
      }

      let imageUrl = null;
      const firstFile = files[0];

      const relativeFilePath = path
        .relative("uploads", firstFile.path)
        .replace(/\\/g, "/");
      imageUrl = relativeFilePath;

      subcategory.categoryImageUrl = imageUrl;

      await subcategory.save();
      res
        .status(200)
        .json(createSuccessJson("BE_category_image_sucessfully_added", null));
      return;
    } catch (error: any) {
      console.log(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

//Get Main Categories- for Admin
export const getMainCategoriesAdmin = async (
  req: Request<{}, {}, {}>,
  res: Response<ApiResponse<CategoryInfo[]>>
) => {
  try {
    const mainCategories = await Category.find({
      isMainCategory: true,
    })
      .select("_id name")
      .lean();

    const categoriesWithStringId = mainCategories.map((cat) => ({
      ...cat,
      _id: cat._id.toString(),
    }));

    res
      .status(201)
      .json(
        createSuccessJson<CategoryInfo[]>(
          "BE_categories_fetch_successfully",
          categoriesWithStringId
        )
      );
  } catch (error: any) {
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

//Get active main categories- for user
export const getMainCategories = async (
  req: Request<{}, {}, {}>,
  res: Response<ApiResponse<CategoryInfo[]>>
) => {
  try {
    const mainCategories = await Category.find({
      isMainCategory: true,
      isActive: true,
    })
      .select("_id name")
      .lean();

    const categoriesWithStringId = mainCategories.map((cat) => ({
      ...cat,
      _id: cat._id.toString(),
    }));

    res
      .status(201)
      .json(
        createSuccessJson<CategoryInfo[]>(
          "BE_main_categories_fetched_successfully",
          categoriesWithStringId
        )
      );
  } catch (error: any) {
    console.log("Error during fetching main categories:", error);
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

//get active subcategories of main category - for user
export const getSubcategoriesOfMainCategory = async (
  req: Request<{ categoryId: string }, {}, {}>,
  res: Response<ApiResponse<CategoryWithPopulatedSubs>>
) => {
  try {
    const categoryId = req.params.categoryId;

    const mainCategoryWithSubcategories = await Category.findOne({
      _id: categoryId,
      isMainCategory: true,
    })
      .select(" -isMainCategory -createdAt -updatedAt -categoryImageUrl ")
      .populate<{ subcategories: SubcategoriesInfo[] }>({
        path: "subcategories",
        match: { isActive: true },
        select: "-createdAt -updatedAt -subcategories -isMainCategory",
      })
      .lean();

    if (!mainCategoryWithSubcategories) {
      res.status(404).json(
        createErrorJson([
          {
            type: "get-subcategories",
            msg: "BE_category_not_found",
          },
        ])
      );
      return;
    }

    const retrensSubcategories: CategoryWithPopulatedSubs = {
      ...mainCategoryWithSubcategories,
      _id: mainCategoryWithSubcategories._id.toString(),
      subcategories: (mainCategoryWithSubcategories.subcategories ?? []).map(
        (sub) => ({
          ...sub,
          _id: sub._id.toString(),
        })
      ),
    };

    res
      .status(200)
      .json(
        createSuccessJson<CategoryWithPopulatedSubs>(
          "BE_subcategories_of_category_fetched_successfully",
          retrensSubcategories
        )
      );
  } catch (error: any) {
    console.log("Error during fetching subcategories:", error);
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

//get all subcategories of main category- Admin see inactive also
export const getSubcategoriesOfMainCategoryAdmin = async (
  req: Request<{ categoryId: string }, {}, {}>,
  res: Response<ApiResponse<CategoryWithPopulatedSubs>>
) => {
  try {
    const categoryId = req.params.categoryId;

    const mainCategoryWithSubcategories = await Category.findOne({
      _id: categoryId,
      isMainCategory: true,
    })
      .select(" -isMainCategory -createdAt -updatedAt -categoryImageUrl ")
      .populate<{ subcategories: SubcategoriesInfo[] }>({
        path: "subcategories",
        select: "-createdAt -updatedAt -subcategories -isMainCategory",
      })
      .lean();

    if (!mainCategoryWithSubcategories) {
      res.status(404).json(
        createErrorJson([
          {
            type: "get-subcategories",
            msg: "BE_category_not_found",
          },
        ])
      );
      return;
    }

    const retrensSubcategories: CategoryWithPopulatedSubs = {
      ...mainCategoryWithSubcategories,
      _id: mainCategoryWithSubcategories._id.toString(),
      subcategories: (mainCategoryWithSubcategories.subcategories ?? []).map(
        (sub) => ({
          ...sub,
          _id: sub._id.toString(),
        })
      ),
    };

    // console.log(retrensSubcategories);
    res
      .status(200)
      .json(
        createSuccessJson<CategoryWithPopulatedSubs>(
          "BE_subcategories_of_category_fetched_successfully",
          retrensSubcategories
        )
      );
  } catch (error: any) {
    console.log("Error during fetching subcategories admin panel:", error);
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

//Update main category
export const updateMainCategoryInfo = [
  validateRequestWithZod(updateMainCategoryBodySchema),
  async (
    req: Request<{ categoryId: string }, {}, UpdateMainCategoryDto>,
    res: Response<ApiResponse<null>>
  ) => {
    try {
      const category = await Category.findOne({ _id: req.params.categoryId });

      if (!category) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "categoryUpdate", msg: "category_not_exist" },
            ])
          );
        return;
      }

      const categoryWithSameName = await Category.findOne({
        name: req.body.name,
        _id: { $ne: category._id },
      });

      if (categoryWithSameName) {
        res.status(400).json(
          createErrorJson([
            {
              type: "categoryUpdate",
              msg: "category_with_this_name_alredy_exsist",
            },
          ])
        );
        return;
      }

      category.name = req.body.name ? req.body.name : category.name;
      category.description = req.body.description
        ? req.body.description
        : category.description;
      category.isActive = req.body.isActive
        ? req.body.isActive
        : category.isActive;

      await category.save();

      res
        .status(200)
        .json(createSuccessJson("BE_main_category_updated_successfully", null));
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
    }
  },
];

//Update subcategory
export const updateSubcategory = [
  validateRequestWithZod(updateSubcategoryBodySchema),
  async (
    req: Request<{ subcategoryId: string }, {}, UpdateSubcategoryDto>,
    res: Response<ApiResponse<null>>
  ) => {
    try {
      const subcategory = await Category.findOne({
        _id: req.params.subcategoryId,
        isMainCategory: false,
      });

      if (!subcategory) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "categoryUpdate", msg: "subcategory_not_exist" },
            ])
          );
        return;
      }

      subcategory.name = req.body.name ? req.body.name : subcategory.name;
      subcategory.description = req.body.description
        ? req.body.description
        : subcategory.description;
      subcategory.isActive = req.body.isActive
        ? req.body.isActive
        : subcategory.isActive;

      await subcategory.save();

      res
        .status(200)
        .json(createSuccessJson("BE_subcategory_updated_successfully", null));
    } catch (error: any) {
      console.log(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
    }
  },
];

//Update cateogry and subcategory img
export const updateCategoryImage = [
  uploadFiles(uploadOptions),

  async (
    req: Request<{ categoryId: string }, {}, {}>,
    res: Response<ApiResponse<null>>
  ) => {
    try {
      const category = await Category.findOne({ _id: req.params.categoryId });
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res
          .status(400)
          .json(
            createErrorJson([{ type: "general", msg: "image_not_sended" }])
          );
        return;
      }

      if (!category) {
        try {
          await fs.promises.unlink(files[0].path);
          console.log("Uploaded file deleted due to invalid categoryId");
        } catch (err) {
          console.error("Failed to delete uploaded file:", err);
        }

        res
          .status(400)
          .json(
            createErrorJson([{ type: "general", msg: "category_not_exist" }])
          );
        return;
      }

      const oldImagePath = category.categoryImageUrl;
      let newPath = oldImagePath;

      const firstFile = files[0];
      const relativeFilePath = path
        .relative("uploads", firstFile.path)
        .replace(/\\/g, "/");

      newPath = relativeFilePath;
      category.categoryImageUrl = newPath;

      if (oldImagePath && oldImagePath !== newPath) {
        const fullOldPath = path.join("uploads", oldImagePath);
        try {
          await fs.promises.unlink(fullOldPath);
          console.log("Old image deleted:", fullOldPath);
        } catch (err) {
          console.error("Failed to delete old image:", err);
        }
      }

      await category.save();

      res
        .status(200)
        .json(
          createSuccessJson("BE_category_image_updated_successfully", null)
        );
      return;
    } catch (error: any) {
      console.log(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
    }
  },
];

export const updateSubCategoryImage = [
  uploadFiles(uploadOptions),

  async (
    req: Request<{ categoryId: string; subcategoryId: string }, {}, {}>,
    res: Response<ApiResponse<null>>
  ) => {
    try {
      const category = await Category.findOne({ _id: req.params.categoryId });
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res
          .status(400)
          .json(
            createErrorJson([{ type: "general", msg: "image_not_sended" }])
          );
        return;
      }

      if (!category) {
        try {
          await fs.promises.unlink(files[0].path);
          console.log("Uploaded file deleted due to invalid categoryId");
        } catch (err) {
          console.error("Failed to delete uploaded file:", err);
        }

        res
          .status(400)
          .json(
            createErrorJson([{ type: "general", msg: "category_not_exist" }])
          );
        return;
      }

      const subcategory = await Category.findOne({
        _id: req.params.subcategoryId,
        isMainCategory: false,
        parentCategory: req.params.categoryId,
      });

      if (!subcategory) {
        try {
          await fs.promises.unlink(files[0].path);
          console.log("Uploaded file deleted due to invalid categoryId");
        } catch (err) {
          console.error("Failed to delete uploaded file:", err);
        }

        res
          .status(400)
          .json(
            createErrorJson([{ type: "general", msg: "subcategory_not_exist" }])
          );
        return;
      }

      const oldImagePath = subcategory.categoryImageUrl;
      let newPath = oldImagePath;

      const firstFile = files[0];
      const relativeFilePath = path
        .relative("uploads", firstFile.path)
        .replace(/\\/g, "/");

      newPath = relativeFilePath;
      subcategory.categoryImageUrl = newPath;

      if (oldImagePath && oldImagePath !== newPath) {
        const fullOldPath = path.join("uploads", oldImagePath);
        try {
          await fs.promises.unlink(fullOldPath);
          console.log("Old image deleted:", fullOldPath);
        } catch (err) {
          console.error("Failed to delete old image:", err);
        }
      }

      await subcategory.save();

      res
        .status(200)
        .json(
          createSuccessJson("BE_subcategory_image_updated_successfully", null)
        );
      return;
    } catch (error: any) {
      console.log(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
    }
  },
];

export const getCategory = async (
  req: Request<{ categoryId: string }, {}, {}>,
  res: Response<ApiResponse<CategoryDto>>
) => {
  try {
    const category = await Category.findOne({
      _id: req.params.categoryId,
    })
      .select("-createdAt -updatedAt")
      .populate({
        path: "subcategories",
        select: "-createdAt -updatedAt",
      });
    if (!category) {
      res
        .status(400)
        .json(
          createErrorJson([{ type: "general", msg: "category_not_exist" }])
        );
      return;
    }

    const { _id: v, ...rest } = category.toObject();

    const publicCategory = {
      _id: category._id.toString(),
      ...rest,
    };

    res
      .status(200)
      .json(
        createSuccessJson("BE_category_fetched_successfully", publicCategory)
      );
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
  }
};

//Soft delete
export const softDeleteCategory = async (
  req: Request<{ categoryId: string }, {}, {}>,
  res: Response
) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findOne({
      _id: req.params.categoryId,
    });

    if (!category) {
      res
        .status(400)
        .json(
          createErrorJson([{ type: "general", msg: "category_not_exist" }])
        );
      return;
    }

    category.isActive = false;

    await Category.updateMany(
      { _id: { $in: category.subcategories } },
      { isActive: false }
    );

    await category.save();

    res
      .status(200)
      .json(
        createSuccessJson("BE_category_deletd_successfully", { categoryId })
      );
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
  }
};
