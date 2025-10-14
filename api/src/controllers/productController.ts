import { uploadFiles } from "../middleware/uploadMilldeware";
import { validateRequestWithZodAndCleanFiles } from "../middleware/validateRequestWithZodAndCleanFiles";
import { ApiResponse } from "../types/common";
import { UploadPath, UploadType } from "../types/uploadFiles";
import { Request, Response } from "express";
import { createErrorJson, createSuccessJson } from "../utils/responseWrapper";
import { validateRequestWithZod } from "../middleware/validateRequestMiddleware";
import { request } from "http";
import { Product } from "../models/product";
import { addProductBasicInfoBodySchema } from "../schemas/product/addProduct";
import {
  AddedProductInfo,
  addProductVariantPicture,
  AvailableVariantColors,
  ProductBasicInfoToAddDto,
  ProductBySku,
  ProductDto,
  ProductFilter,
  ProductsResponseDto,
  ProductVariantAddedDto,
  ProductVariantDto,
  ProductVariantToAdd,
  ProductVariantToUpdateDto,
  ProductVariantUpdatedDto,
  SizeInfo,
  SizeInfoToAdd,
  TagsToAdd,
  UpdatedProductInfo,
  VariantSizeInfo,
  VariationFilter,
} from "../types/product";
import { productVariationSchema } from "../schemas/product/addProductVariant";
import { ProductVariant } from "../models/productVariant";
import path from "path";
import { addProductVariantPhotoBodySchema } from "../schemas/product/addProductVariantPhoto";
import mongoose, { Types } from "mongoose";
import addColorAndNameToReqBody from "../middleware/addColorAndNameToReqBody";
import { updateProductBasicInfoBodySchema } from "../schemas/product/updateProductBasicInfo";
import { ObjectId } from "mongoose";
import { updateProductVariantInfoBodySchema } from "../schemas/product/updateProductVariantInfo";
import fs from "fs";
import { Category } from "../models/category";
import {
  allColorsArray,
  BaseColor,
  ExtendedColor,
  Material,
  ProductTag,
  productTagsArray,
  Size,
} from "../constants/product";
import { addProductTagsBodySchema } from "../schemas/product/addProductTag";
import { addVariationSizeBodySchema } from "../schemas/product/addVariationSizeSchema";
import { deleteVariantFolder } from "../utils/deteteVariantFolder";
import { parentPort } from "worker_threads";
import { uploadFilesOnCloudinary } from "../middleware/uploadImageOnCloudinary";
import { deleteImageFromCloudinary } from "../utils/deleteImageFromCloudinary";
import { buildProductFilter } from "../utils/buildProductFilter";
import { buildVariationFilter } from "../utils/buildVariationFilter";
import { sortFilter } from "../utils/buildSortFilter";

//Upload options
let uploadOptions = {
  type: UploadType.MULTIPLE,
  uploadPath: UploadPath.PRODUCT,
  maxFileSize: 5 * 1024 * 1024, // npr 5MB
};

//Adding basic product information
export const addProductBasicInfo = [
  //Data validation from the requirements body
  validateRequestWithZod(addProductBasicInfoBodySchema),
  async (
    req: Request<{}, {}, ProductBasicInfoToAddDto>,
    res: Response<ApiResponse<AddedProductInfo>>
  ) => {
    try {
      const product = await Product.findOne({
        $or: [{ name: req.body.name }, { modelCode: req.body.modelCode }],
      });

      if (product) {
        const errorType =
          product.name === req.body.name
            ? "BE_product_already_exists"
            : "BE_model_code_already_exists";
        res
          .status(400)
          .json(createErrorJson([{ type: "addProduct", msg: errorType }]));
        return;
      }

      const category = await Category.findOne({
        _id: req.body.category,
        isMainCategory: true,
      });

      if (!category) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addProduct", msg: "BE_category_not_exsist" },
            ])
          );
        return;
      }

      const subcategoryIds = req.body.subcategory;

      const subcategories = await Category.find({
        _id: { $in: subcategoryIds },
        isMainCategory: false,
        parentCategory: req.body.category,
      });

      if (!subcategories || subcategories.length !== subcategoryIds.length) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addProduct", msg: "BE_subcategory_not_exsist" },
            ])
          );
        return;
      }

      const newProduct = new Product({
        category: req.body.category,
        subcategory: req.body.subcategory,
        name: req.body.name,
        description: req.body.description,
        material: req.body.material,
        careInstructions: req.body.careInstructions,
        countryBrand: req.body.countryBrand,
        price: req.body.price,
        discountPrice: req.body.discountPrice ? req.body.discountPrice : null,
        modelCode: req.body.modelCode,
        productTag: req.body.productTag,
        isActive: req.body.isActive,
      });

      await newProduct.save();

      const {
        _id,
        __v,
        category: productCategory,
        subcategory: productSubcategory,
        ...rest
      } = newProduct.toObject();

      const addedProductInfo: AddedProductInfo = {
        _id: newProduct._id.toString(),
        category: productCategory.toString(),
        subcategory: productSubcategory.map((_id) => _id.toString()),
        ...rest,
      };

      res
        .status(200)
        .json(
          createSuccessJson(
            "BE_product_basic_info_added_successfully",
            addedProductInfo
          )
        );
      return;
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

//Adding basic information about the product variant
export const addProductVariationInfo = [
  //Validation of data from the request body
  validateRequestWithZod(productVariationSchema),
  async (
    req: Request<{}, {}, ProductVariantToAdd>,
    res: Response<ApiResponse<ProductVariantAddedDto>>
  ) => {
    try {
      //Check if the product to which the variant is linked exists
      const product = await Product.findOne({
        _id: req.body.product_id,
      });

      if (!product) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addProductVariantInfo", msg: "BE_product_not_exists" },
            ])
          );
        return;
      }

      //Check if the variant already exists
      const existingVariant = await ProductVariant.findOne({
        product_id: req.body.product_id,
        color: req.body.color,
      });

      if (existingVariant) {
        res.status(400).json(
          createErrorJson([
            {
              type: "addProductVariantInfo",
              msg: "BE_product_variant_already_exists",
            },
          ])
        );
        return;
      }

      //Based on the information, create a SKU
      const sizesWithSKU = req.body.sizes.map((size: SizeInfoToAdd) => ({
        ...size,
        SKU: `${product.modelCode.toUpperCase()}-${req.body.color.toUpperCase()}-${size.size.toUpperCase()}`,
      }));

      //Creating a model for the database
      const newProductVariation = new ProductVariant({
        product_id: req.body.product_id,
        color: req.body.color,
        images: [],
        cloudinaryIds: [],
        isActive: req.body.isActive,
        sizes: sizesWithSKU,
      });

      //Save variation
      await newProductVariation.save();

      const { _id, cloudinaryIds, product_id, ...rest } =
        newProductVariation.toObject();

      const addedProductVariantInfo: ProductVariantAddedDto = {
        _id: _id.toString(),
        product_id: product_id.toString(),
        ...rest,
      };

      res
        .status(200)
        .json(
          createSuccessJson(
            "BE_variant_basic_info_added_successfully",
            addedProductVariantInfo
          )
        );
      return;
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

//CLOUDINARY
export const addProductVariationPicsCloudinary = [
  uploadFilesOnCloudinary(uploadOptions),
  async (
    req: Request<{ variationId: string; productId: string }, {}, {}>,
    res: Response<ApiResponse<ProductVariantAddedDto>>
  ) => {
    try {
      const files = req.files as any[];

      if (!files || files.length === 0) {
        res
          .status(400)
          .json(
            createErrorJson([{ type: "general", msg: "BE_image_not_sended" }])
          );
        return;
      }

      let imageUrls: string[] = [];
      let cloudianryIds: string[] = [];

      imageUrls = files.map((file) => file.path);

      cloudianryIds = files.map((file) => file.filename);

      const variation = await ProductVariant.findOne({
        _id: req.params.variationId,
        product_id: req.params.productId,
      });

      if (!variation) {
        await deleteImageFromCloudinary(imageUrls);
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addCategory", msg: "BE_variation_not_found" },
            ])
          );
        return;
      }

      const productId = req.params.productId;

      const product = await Product.findOne({ _id: productId });

      if (!product) {
        await deleteImageFromCloudinary(imageUrls);
        res
          .status(400)
          .json(
            createErrorJson([{ type: "addCategory", msg: "product_not_found" }])
          );
        return;
      }

      variation.images = imageUrls;
      variation.cloudinaryIds = cloudianryIds;

      await variation.save();

      const { _id, cloudinaryIds, product_id, ...rest } = variation.toObject();

      const addedVariation: ProductVariantAddedDto = {
        _id: variation._id.toHexString(),
        product_id: variation.product_id.toString(),
        ...rest,
      };

      res
        .status(200)
        .json(
          createSuccessJson(
            "BE_variant_image_added_sucessfully",
            addedVariation
          )
        );
      return;
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

//Add variation size
export const addVariationSize = [
  validateRequestWithZod(addVariationSizeBodySchema),
  async (
    req: Request<{ variationId: string; productId: string }, {}, SizeInfoToAdd>,
    res: Response<ApiResponse<null>>
  ) => {
    try {
      const product = await Product.findOne({ _id: req.params.productId });

      if (!product) {
        res
          .status(400)
          .json(
            createErrorJson([{ type: "addCategory", msg: "product_not_found" }])
          );
        return;
      }

      const variation = await ProductVariant.findOne({
        _id: req.params.variationId,
        product_id: req.params.productId,
      });

      if (!variation) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addCategory", msg: "variation_not_found" },
            ])
          );
        return;
      }

      const sizeToAdd: SizeInfoToAdd = {
        size: req.body.size,
        stock: req.body.stock,
      };

      if (variation.sizes.some((s) => s.size === sizeToAdd.size)) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "general", msg: "BE_size_already_exsist" },
            ])
          );
        return;
      }

      const extendedSizeToAdd: SizeInfo = {
        ...sizeToAdd,
        SKU: `${product.modelCode.toUpperCase()}-${variation.color.toUpperCase()}-${sizeToAdd.size.toUpperCase()}`,
      };

      variation.sizes.push(extendedSizeToAdd);

      await variation.save();

      res
        .status(200)
        .json(createSuccessJson("BE_variant_new_size_added_sucessfully", null));
      return;
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

//Add product tag
export const addTagsToProduct = [
  validateRequestWithZod(addProductTagsBodySchema),
  async (
    req: Request<{ productId: string }, {}, TagsToAdd>,
    res: Response<ApiResponse<null>>
  ) => {
    try {
      const product = await Product.findOne({ _id: req.params.productId });

      if (!product) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "getProducts", msg: "BE_product_not_exsist" },
            ])
          );
        return;
      }

      const tagsToAdd: ProductTag[] = req.body.tags;

      product.productTag = product.productTag || [];

      //Check if any tag ec exists
      const existingTags = new Set(product.productTag);

      for (const tag of tagsToAdd) {
        if (!existingTags.has(tag)) {
          product.productTag.push(tag);
        }
      }

      await product.save();

      res
        .status(200)
        .json(createSuccessJson("BE_tag(s)_added_sucessfully", null));
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

//UPDATE

//Update basic info about product
export const updateProductBasicInfo = [
  validateRequestWithZod(updateProductBasicInfoBodySchema),
  async (
    req: Request<{ productId: string }, {}, ProductBasicInfoToAddDto>,
    res: Response<ApiResponse<UpdatedProductInfo>>
  ) => {
    try {
      const product = await Product.findOne({ _id: req.params.productId });

      if (!product) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addProduct", msg: "BE_product_not_found" },
            ])
          );
        return;
      }

      product.name = req.body.name ? req.body.name : product.name;
      product.description = req.body.description
        ? req.body.description
        : product.description;
      product.category = req.body.category
        ? new mongoose.Types.ObjectId(req.body.category)
        : product.category;
      product.material = req.body.material
        ? req.body.material
        : product.material;
      product.subcategory = req.body.subcategory
        ? req.body.subcategory.map((id) => new mongoose.Types.ObjectId(id))
        : product.subcategory;
      product.careInstructions = req.body.careInstructions
        ? req.body.careInstructions
        : product.careInstructions;
      product.countryBrand = req.body.countryBrand
        ? req.body.countryBrand
        : product.countryBrand;
      product.price = req.body.price ? req.body.price : product.price;
      product.discountPrice = req.body.discountPrice
        ? req.body.discountPrice
        : product.discountPrice;
      product.productTag = req.body.productTag
        ? req.body.productTag
        : product.productTag;
      product.isActive = req.body.isActive
        ? req.body.isActive
        : product.isActive;

      await product.save();

      const { _id, category, subcategory, ...rest } = product.toObject();

      const updatedProductInfo: UpdatedProductInfo = {
        _id: product._id.toString(),
        category: category.toString(),
        subcategory: subcategory.map((_id) => _id.toString()),
        ...rest,
      };

      res
        .status(200)
        .json(
          createSuccessJson(
            "BE_product_basic_info_updated_successfully",
            updatedProductInfo
          )
        );
      return;
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

//Update basic info about product variant
export const updateProductVariantInfo = [
  validateRequestWithZod(updateProductVariantInfoBodySchema),
  async (
    req: Request<{ variantId: string }, {}, ProductVariantToUpdateDto>,
    res: Response<ApiResponse<ProductVariantUpdatedDto>>
  ) => {
    try {
      const variant = await ProductVariant.findOne({
        _id: req.params.variantId,
      });

      if (!variant) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addProduct", msg: "BE_variant_not_found" },
            ])
          );
        return;
      }

      const updatedSizes = variant.sizes.map((existingSize) => {
        const incomingSize = req.body.sizes!.find(
          (s) => s.size === existingSize.size
        );

        return incomingSize
          ? {
              size: existingSize.size,
              stock: incomingSize.stock,
              SKU: existingSize.SKU,
            }
          : existingSize;
      });

      const isActiveUpdate = req.body.isActive
        ? req.body.isActive
        : variant.isActive;

      const updatedVariant = await ProductVariant.findByIdAndUpdate(
        req.params.variantId,
        {
          sizes: updatedSizes,
          isActive: isActiveUpdate,
        },
        { new: true, runValidators: true }
      );

      if (!updatedVariant) {
        res
          .status(404)
          .json(
            createErrorJson([
              { type: "updateVariant", msg: "BE_variant_not_found" },
            ])
          );
        return;
      }

      const { _id, product_id, cloudinaryIds, ...rest } =
        updatedVariant.toObject();

      const updatedVariantInfo: ProductVariantUpdatedDto = {
        _id: _id.toString(),
        product_id: product_id.toString(),
        ...rest,
      };

      res
        .status(200)
        .json(
          createSuccessJson(
            "BE_variant_basic_info_updated_successfully",
            updatedVariantInfo
          )
        );
      return;
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

//CLOUDINARY
export const updateProductVariationPicsCloudinary = [
  uploadFilesOnCloudinary(uploadOptions),
  async (
    req: Request<{ variationId: string; productId: string }, {}, {}>,
    res: Response<ApiResponse<ProductVariantUpdatedDto>>
  ) => {
    try {
      const files = req.files as any[];

      if (!files || files.length === 0) {
        res
          .status(400)
          .json(
            createErrorJson([{ type: "general", msg: "BE_image_not_sended" }])
          );
        return;
      }

      let imageUrls: string[] = [];
      let cloudianryIds: string[] = [];

      imageUrls = files.map((file) => file.path);

      cloudianryIds = files.map((file) => file.filename);

      const variation = await ProductVariant.findOne({
        _id: req.params.variationId,
        product_id: req.params.productId,
      });

      //Because of the middleware we will catch this error before we get here
      if (!variation) {
        await deleteImageFromCloudinary(imageUrls);
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addCategory", msg: "BE_variation_not_found" },
            ])
          );
        return;
      }

      const productId = req.params.productId;

      const product = await Product.findOne({ _id: productId });

      //Because of the middleware we will catch this error before we get here
      if (!product) {
        await deleteImageFromCloudinary(imageUrls);
        res
          .status(400)
          .json(
            createErrorJson([{ type: "addCategory", msg: "product_not_found" }])
          );
        return;
      }

      const odlUrls = variation.images;
      const olsCloudinaryIds = variation.cloudinaryIds;

      variation.images = imageUrls;
      variation.cloudinaryIds = cloudianryIds;

      await variation.save();

      await deleteImageFromCloudinary(olsCloudinaryIds);

      const { _id, product_id, cloudinaryIds, ...rest } = variation.toObject();

      const updatedVariantInfo: ProductVariantUpdatedDto = {
        _id: _id.toString(),
        product_id: product_id.toString(),
        ...rest,
      };

      res
        .status(200)
        .json(
          createSuccessJson(
            "BE_variant_image_updated_sucessfully",
            updatedVariantInfo
          )
        );
      return;
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

//Local upload
//Update variant image
// export const updateProductVariationPics = [
//   uploadFiles(uploadOptions),

//   async (
//     req: Request<{ variationId: string; productId: string }, {}>,
//     res: Response<ApiResponse<null>>
//   ) => {
//     try {
//       const files = req.files as Express.Multer.File[];

//       if (!files || files.length === 0) {
//         res
//           .status(400)
//           .json(
//             createErrorJson([{ type: "general", msg: "image_not_sended" }])
//           );
//         return;
//       }

//       const variation = await ProductVariant.findOne({
//         _id: req.params.variationId,
//         product_id: req.params.productId,
//       });

//       if (!variation) {
//         res
//           .status(400)
//           .json(
//             createErrorJson([
//               { type: "addCategory", msg: "BE_variation_not_found" },
//             ])
//           );
//         return;
//       }

//       let newImagesUrls: string[] = [];
//       const oldImagesUrls = variation.images;

//       newImagesUrls = files.map((file) =>
//         path.relative("uploads", file.path).replace(/\\/g, "/")
//       );

//       variation.images = newImagesUrls;

//       if (oldImagesUrls) {
//         await Promise.all(
//           oldImagesUrls.map(async (oldImagePath) => {
//             const fullOldPath = path.join("uploads", oldImagePath);
//             try {
//               await fs.promises.unlink(fullOldPath);
//               console.log("Old image deleted:", fullOldPath);
//             } catch (err) {
//               console.error("Failed to delete old image:", err);
//             }
//           })
//         );
//       }

//       await variation.save();

//       res
//         .status(200)
//         .json(createSuccessJson("BE_variant_picture_added_sucessfully", null));
//       return;
//     } catch (error: any) {
//       console.error(error);
//       res
//         .status(500)
//         .json(
//           createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
//         );
//       return;
//     }
//   },
// ];

//READ
export const getAllProducts = async (
  req: Request<
    {},
    {},
    {},
    {
      categoryId?: string;
      subcategoryId?: string;
      tag?: string;
      material?: Material;
      discountPrice?: string;
      minPrice?: string;
      maxPrice?: string;
      color?: BaseColor | ExtendedColor;
      size?: Size;
      sortOption?: "asc" | "desc";
      page?: string;
      limit?: string;
    }
  >,
  res: Response<ApiResponse<ProductsResponseDto>>
) => {
  try {
    const {
      categoryId,
      subcategoryId,
      tag,
      color,
      size,
      sortOption,
      maxPrice,
      minPrice,
      discountPrice,
      material,
    } = req.query;

    const matchFilter: any = { isActive: true };

    if (!subcategoryId && !categoryId && !tag) {
      res
        .status(400)
        .json(
          createErrorJson([
            { type: "getProducts", msg: "BE_no_match_selected" },
          ])
        );
      return;
    }

    if (subcategoryId) {
      const subcategory = await Category.findOne({
        _id: subcategoryId,
        isMainCategory: false,
      });

      if (!subcategory) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "getProducts", msg: "BE_subcategory_not_exsist" },
            ])
          );
        return;
      }

      matchFilter.subcategory = new mongoose.Types.ObjectId(subcategoryId);
    }

    if (tag) {
      matchFilter.productTag = {
        $in: Array.isArray(req.query.tag) ? req.query.tag : [req.query.tag],
      };
    }

    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        isMainCategory: true,
      });

      if (!category) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "getProducts", msg: "BE_category_not_exsist" },
            ])
          );
        return;
      }

      //Include category as a secondary filter only when a tag or subcategory is provided. Does not list products by category alone
      if (tag || subcategoryId) {
        matchFilter.category = new mongoose.Types.ObjectId(categoryId);
      }
    }

    // Filters for product
    const productFilter = buildProductFilter({
      material,
      discountPrice,
      minPrice,
      maxPrice,
    });

    // Filters for variation
    const variationFilter = buildVariationFilter({ color, size });

    //Pagination options
    const pageNum = parseInt(req.query.page || "1");
    const limitNum = parseInt(req.query.limit || "30");
    const skip = (pageNum - 1) * limitNum;

    //Sort Filter
    const discount = discountPrice === "true";
    const sortQuery = sortFilter({ discount, sortOption });
    // Aggregation
    const pipeline = [
      // Filter products by subcategory and basic filters
      {
        $match: {
          ...matchFilter,
          ...productFilter,
        },
      },

      // Join product and variant
      {
        $lookup: {
          from: "productvariants",
          localField: "_id",
          foreignField: "product_id",
          as: "variations",
        },
      },

      // Variant filter
      {
        $addFields: {
          variations: {
            $filter: {
              input: "$variations",
              as: "v",
              cond: {
                $and: [
                  // only active ones
                  { $eq: ["$$v.isActive", true] },
                  // varijanta mora imati slike
                  { $gt: [{ $size: "$$v.images" }, 0] },
                  // Color filter
                  ...(variationFilter.color
                    ? [{ $eq: ["$$v.color", variationFilter.color] }]
                    : []),
                  // Size filter
                  ...(variationFilter.size
                    ? [
                        {
                          $anyElementTrue: {
                            $map: {
                              input: "$$v.sizes", // goes through all size variants
                              as: "s",
                              in: {
                                $eq: ["$$s.size", variationFilter.size],
                              },
                            },
                          },
                        },
                      ]
                    : []),
                ],
              },
            },
          },
        },
      },

      // Remove products that do not have any variants after filtering
      { $match: { variations: { $ne: [] } } },

      // Sort
      { $sort: sortQuery },

      // Pagination and counting of total products
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limitNum },
            {
              $project: {
                _id: 1,
                name: 1,
                price: 1,
                discountPrice: 1,
                category: 1,
                subcategory: 1,
                material: 1,
                variations: {
                  _id: 1,
                  color: 1,
                  sizes: 1,
                  images: 1,
                  isActive: 1,
                },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Product.aggregate(pipeline);

    const products = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(total / limitNum);

    // console.log(JSON.stringify(result, null, 2));

    const productsDto: ProductDto[] = products.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      category: p.category.toString(),
      subcategory: p.subcategory.toString(),
      variations: p.variations.map((v: any) => ({
        ...v,
        _id: v._id.toString(),
        sizes: v.sizes.map((s: any) => ({
          ...s,
          _id: s._id.toString(),
          isAvailable: s.stock > 0,
        })),
      })),
    }));

    const productResponseDto: ProductsResponseDto = {
      page: pageNum,
      total,
      totalPages,
      products: productsDto,
    };

    res
      .status(200)
      .json(createSuccessJson("BE_get_products_success", productResponseDto));
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
  }
};

//get product variation by SKU - only for admin
export const getProductVariantBySku = async (
  req: Request<{ sku: string }, {}, {}>,
  res: Response<ApiResponse<ProductBySku>>
) => {
  try {
    const productVariantToFind = await ProductVariant.findOne(
      { "sizes.SKU": req.params.sku }, // filter by SKU
      {
        sizes: { $elemMatch: { SKU: req.params.sku } }, // return only this size
        color: 1,
        product_id: 1,
        images: 1,
      }
    ).lean();

    if (!productVariantToFind) {
      res
        .status(400)
        .json(
          createErrorJson([
            { type: "getProducts", msg: "BE_product_not_exsist" },
          ])
        );
      return;
    }

    const returnedProductBySku: ProductBySku = {
      ...productVariantToFind,
      product_id: productVariantToFind.product_id.toString(),
      _id: productVariantToFind._id.toString(),
      sizes: [
        {
          ...productVariantToFind.sizes[0],
          isAvailable: productVariantToFind.sizes[0].stock > 0,
        },
      ],
    };

    res
      .status(200)
      .json(
        createSuccessJson(
          "BE_get_main_category_subcategories_success",
          returnedProductBySku
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

//get Available Tags for Product - useful for admin panel
export const returnavailableTagsForProduct = [
  async (
    req: Request<{ productId: string }, {}, {}>,
    res: Response<ApiResponse<TagsToAdd>>
  ) => {
    try {
      const product = await Product.findOne({ _id: req.params.productId });

      if (!product) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "getProducts", msg: "BE_product_not_exsist" },
            ])
          );
        return;
      }

      const availableTags: TagsToAdd = { tags: [] };

      productTagsArray.forEach((tag) => {
        if (!product.productTag?.includes(tag)) {
          availableTags.tags.push(tag);
        }
      });
      res
        .status(200)
        .json(
          createSuccessJson("BE_available_tags_get_sucessfully", availableTags)
        );
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

//Get available Colors For Product Variation
export const getAvailableColorsForProductVariation = async (
  req: Request<{ productId: string }, {}, {}>,
  res: Response<ApiResponse<AvailableVariantColors>>
) => {
  try {
    const variants = await ProductVariant.find({
      product_id: req.params.productId,
    })
      .select("color -_id")
      .lean();

    if (!variants) {
      res.status(200).json(
        createSuccessJson("BE_all_colors_aviliable", {
          availableColors: allColorsArray,
        })
      );
      return;
    }

    const availableColorsForVariant: AvailableVariantColors = {
      availableColors: [],
    };

    const allColors = allColorsArray;

    allColors.forEach((color) => {
      if (!variants.some((c) => c.color === color)) {
        availableColorsForVariant.availableColors.push(color);
      }
    });

    res
      .status(200)
      .json(
        createSuccessJson("BE_aviliable_colors", availableColorsForVariant)
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
};

export const softDeleteProduct = async (
  req: Request<{ productId: string }, {}, {}>,
  res: Response
) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      res
        .status(404)
        .json(
          createErrorJson([{ type: "softDelete", msg: "BE_product_not_exist" }])
        );
      return;
    }

    product.isActive = false;
    await product.save();

    res
      .status(200)
      .json(createSuccessJson("BE_product_soft_deleted", { productId }));
    return;
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

//Add product variation image - Local Upload Wokrs
// export const addProductVariationPics = [
//   uploadFiles(uploadOptions),

//   async (
//     req: Request<{ variationId: string; productId: string }, {}, {}>,
//     res: Response<ApiResponse<null>>
//   ) => {
//     try {
//       const files = req.files as Express.Multer.File[];

//       if (!files || files.length === 0) {
//         res
//           .status(400)
//           .json(
//             createErrorJson([{ type: "general", msg: "BE_image_not_sended" }])
//           );
//         return;
//       }
//       const variation = await ProductVariant.findOne({
//         _id: req.params.variationId,
//       });

//       if (!variation) {
//         res
//           .status(400)
//           .json(
//             createErrorJson([
//               { type: "addCategory", msg: "BE_variation_not_found" },
//             ])
//           );
//         return;
//       }

//       const productId = req.params.productId;

//       const product = await Product.findOne({ _id: productId });

//       if (!product) {
//         res
//           .status(400)
//           .json(
//             createErrorJson([{ type: "addCategory", msg: "product_not_found" }])
//           );
//         return;
//       }

//       let imageUrls: string[] = [];

//       imageUrls = files.map((file) =>
//         path.relative("uploads", file.path).replace(/\\/g, "/")
//       );

//       variation.images = variation.images
//         ? [...variation.images, ...imageUrls]
//         : imageUrls;

//       await variation.save();

//       res
//         .status(200)
//         .json(createSuccessJson("BE_variant_image_added_sucessfully", null));
//       return;
//     } catch (error: any) {
//       console.error(error);
//       res
//         .status(500)
//         .json(
//           createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
//         );
//       return;
//     }
//   },
// ];

//OLD ROUTES (BEFORE CHANGE IN RELATIONSHIP BETWEEN PRODUCT AND VARIATION)
// export const getAllproductsBySubcategory = async (
//   req: Request<{ subcategoryId: string }, {}, {}>,
//   res: Response<ApiResponse<ProductDto[]>>
// ) => {
//   try {
//     const subcategory = await Category.findOne({
//       _id: req.params.subcategoryId,
//       isMainCategory: false,
//     });

//     if (!subcategory) {
//       res
//         .status(400)
//         .json(
//           createErrorJson([
//             { type: "getProducts", msg: "BE_subcategory_not_exsist" },
//           ])
//         );
//       return;
//     }

//     const products = await Product.aggregate([
//       {
//         $match: {
//           subcategory: new mongoose.Types.ObjectId(req.params.subcategoryId),
//           isActive: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "productvariants",
//           localField: "variations",
//           foreignField: "_id",
//           as: "variations",
//           pipeline: [
//             {
//               $match: {
//                 images: { $exists: true, $ne: [] },
//                 isActive: true, // dodaje filtriranje po vidljivosti varijante
//               },
//             },
//             {
//               $project: {
//                 cloudianryIds: 0, // ovo uklanja polje
//               },
//             },
//           ],
//         },
//       },
//       {
//         $match: { "variations.0": { $exists: true } }, // zadrži samo proizvode koji imaju bar 1 variant sa slikama
//       },
//     ]);

//     const productsDto: ProductDto[] = products.map((p) => ({
//       ...p,
//       _id: p._id.toString(),
//       category: p.category.toString(),
//       subcategory: p.subcategory.toString(),
//       variations: p.variations.map((v: any) => ({
//         ...v,
//         _id: v._id.toString(),
//         sizes: v.sizes.map((s: any) => ({
//           ...s,
//           _id: s._id.toString(),
//           isAvailable: s.stock > 0,
//         })),
//       })),
//     }));

//     res
//       .status(200)
//       .json(
//         createSuccessJson("BE_products_of_subcategories_success", productsDto)
//       );
//   } catch (error: any) {
//     res
//       .status(500)
//       .json(
//         createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
//       );
//     return;
//   }
// };

//get product - for users
//Variants without images are treated as drafts and are not sent to the user.
// export const getProduct = async (
//   req: Request<{ productId: string }, {}, {}>,
//   res: Response<ApiResponse<ProductDto>>
// ) => {
//   try {
//     const returnedProduct = await Product.findOne({
//       _id: req.params.productId,
//     })
//       .select("-createdAt -updatedAt")
//       .populate({
//         path: "variations",
//         match: {
//           images: { $exists: true, $ne: [] },
//           isActive: true, // filtrira samo aktivne varijante
//         },
//         select: "-createdAt -updatedAt -cloudianryIds",
//       })
//       .lean();

//     if (!returnedProduct) {
//       res
//         .status(400)
//         .json(
//           createErrorJson([
//             { type: "getProducts", msg: "BE_product_not_exsist" },
//           ])
//         );
//       return;
//     }

//     const productDto: ProductDto = {
//       ...returnedProduct,
//       _id: returnedProduct._id.toString(),
//       category: returnedProduct.category.toString(),
//       subcategory: returnedProduct.subcategory.toString(),
//       variations: returnedProduct.variations.map((v: any) => ({
//         ...v,
//         _id: v._id.toString(),
//         sizes: v.sizes.map((s: any) => ({
//           ...s,
//           _id: s._id.toString(),
//           isAvailable: s.stock > 0,
//         })),
//       })),
//     };

//     res
//       .status(200)
//       .json(createSuccessJson("BE_get_product_success", productDto));
//   } catch (error: any) {
//     res
//       .status(500)
//       .json(
//         createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
//       );
//     return;
//   }
// };

//get product - for users
//Variants without images are treated as drafts and are not sent to the user.
// export const getProduct = async (
//   req: Request<{ productId: string }, {}, {}>,
//   res: Response<ApiResponse<ProductDto>>
// ) => {
//   try {
//     const returnedProduct = await Product.findOne({
//       _id: req.params.productId,
//     })
//       .select("-createdAt -updatedAt")
//       .populate({
//         path: "variations",
//         match: {
//           images: { $exists: true, $ne: [] },
//           isActive: true, // filtrira samo aktivne varijante
//         },
//         select: "-createdAt -updatedAt -cloudianryIds",
//       })
//       .lean();

//     if (!returnedProduct) {
//       res
//         .status(400)
//         .json(
//           createErrorJson([
//             { type: "getProducts", msg: "BE_product_not_exsist" },
//           ])
//         );
//       return;
//     }

//     const productDto: ProductDto = {
//       ...returnedProduct,
//       _id: returnedProduct._id.toString(),
//       category: returnedProduct.category.toString(),
//       subcategory: returnedProduct.subcategory.toString(),
//       variations: returnedProduct.variations.map((v: any) => ({
//         ...v,
//         _id: v._id.toString(),
//         sizes: v.sizes.map((s: any) => ({
//           ...s,
//           _id: s._id.toString(),
//           isAvailable: s.stock > 0,
//         })),
//       })),
//     };

//     res
//       .status(200)
//       .json(createSuccessJson("BE_get_product_success", productDto));
//   } catch (error: any) {
//     res
//       .status(500)
//       .json(
//         createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
//       );
//     return;
//   }
// };

// Get products by tag (useful for pages with highlighted tag)
// export const getProductsByTag = async (
//   req: Request<{ tag: ProductTag }, {}, {}>,
//   res: Response<ApiResponse<ProductDto[]>>
// ) => {
//   try {
//     const productsToFind = await Product.aggregate([
//       {
//         $match: {
//           productTag: req.params.tag,
//         },
//       },
//       {
//         $lookup: {
//           from: "productvariants",
//           localField: "variations",
//           foreignField: "_id",
//           as: "variations",
//           pipeline: [
//             {
//               $match: {
//                 images: { $exists: true, $ne: [] },
//                 isActive: true, // dodaje filtriranje po vidljivosti
//               },
//             },
//           ],
//         },
//       },
//       {
//         $match: { "variations.0": { $exists: true } }, // zadrži samo proizvode koji imaju bar 1 variant sa slikama
//       },
//     ]);

//     if (!productsToFind) {
//       res
//         .status(400)
//         .json(
//           createErrorJson([
//             { type: "getProducts", msg: "BE_products_not_exsist" },
//           ])
//         );
//       return;
//     }

//     const productsDto: ProductDto[] = productsToFind.map((p) => ({
//       ...p,
//       _id: p._id.toString(),
//       category: p.category.toString(),
//       subcategory: p.subcategory.toString(),
//       variations: p.variations.map((v: any) => ({
//         ...v,
//         _id: v._id.toString(),
//         sizes: v.sizes.map((s: any) => ({
//           ...s,
//           _id: s._id.toString(),
//           isAvailable: s.stock > 0,
//         })),
//       })),
//     }));

//     res
//       .status(200)
//       .json(createSuccessJson("BE_get_products_by_tag_success", productsDto));
//   } catch (error: any) {
//     res
//       .status(500)
//       .json(
//         createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
//       );
//     return;
//   }
// };

//Get product with all variations- for admin panel
// export const getProductWithAllVariations = async (
//   req: Request<{ productId: string }, {}, {}>,
//   res: Response<ApiResponse<ProductDto>>
// ) => {
//   try {
//     const returnedProduct = await Product.findOne({
//       _id: req.params.productId,
//     })
//       .select("-createdAt -updatedAt")
//       .populate({
//         path: "variations",
//         select: "-createdAt -updatedAt -cloudinaryIds",
//       })
//       .lean();

//     if (!returnedProduct) {
//       res
//         .status(400)
//         .json(
//           createErrorJson([
//             { type: "getProducts", msg: "BE_product_not_exsist" },
//           ])
//         );
//       return;
//     }

//     const productDto: ProductDto = {
//       ...returnedProduct,
//       _id: returnedProduct._id.toString(),
//       category: returnedProduct.category.toString(),
//       subcategory: returnedProduct.subcategory.toString(),
//       variations: returnedProduct.variations.map((v: any) => ({
//         ...v,
//         _id: v._id.toString(),
//         sizes: v.sizes.map((s: any) => ({
//           ...s,
//           _id: s._id.toString(),
//           isAvailable: s.stock > 0,
//         })),
//       })),
//     };

//     res
//       .status(200)
//       .json(createSuccessJson("BE_get_product_success", productDto));
//   } catch (error: any) {
//     res
//       .status(500)
//       .json(
//         createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
//       );
//     return;
//   }
// };

// //Get All Products by subcategory, even one without variations- admin panel
// export const getAllproductsBySubcategoryAdmin = async (
//   req: Request<{ subcategoryId: string }, {}, {}>,
//   res: Response<ApiResponse<ProductDto[]>>
// ) => {
//   try {
//     const subcategory = await Category.findOne({
//       _id: req.params.subcategoryId,
//       isMainCategory: false,
//     });

//     if (!subcategory) {
//       res
//         .status(400)
//         .json(
//           createErrorJson([
//             { type: "getProducts", msg: "BE_subcategory_not_exsist" },
//           ])
//         );
//       return;
//     }

//     const products = await Product.find({
//       subcategory: req.params.subcategoryId,
//     })
//       .select("-createdAt -updatedAt")
//       .populate({
//         path: "variations",
//         select: "-createdAt -updatedAt -cloudinaryIds",
//       })
//       .lean();

//     const productsDto: ProductDto[] = products.map((p) => ({
//       ...p,
//       _id: p._id.toString(),
//       category: p.category.toString(),
//       subcategory: p.subcategory.toString(),
//       variations: p.variations.map((v: any) => ({
//         ...v,
//         _id: v._id.toString(),
//         sizes: v.sizes.map((s: any) => ({
//           ...s,
//           _id: s._id.toString(),
//           isAvailable: s.stock > 0,
//         })),
//       })),
//     }));

//     res
//       .status(200)
//       .json(
//         createSuccessJson("BE_get_all_products_admin_success", productsDto)
//       );
//   } catch (error: any) {
//     res
//       .status(500)
//       .json(
//         createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
//       );
//     return;
//   }
// };

// export const getAllproductsBySubcategoryWithFilters = async (
//   req: Request<
//     { subcategoryId: string },
//     {},
//     {},
//     {
//       material?: Material;
//       discountPrice?: string;
//       minPrice?: string;
//       maxPrice?: string;
//       color?: BaseColor | ExtendedColor;
//       size?: Size;
//       sortOption?: "asc" | "desc";
//       page?: string;
//       limit?: string;
//     }
//   >,
//   res: Response<ApiResponse<ProductsResponseDto>>
// ) => {
//   try {
//     const subcategory = await Category.findOne({
//       _id: req.params.subcategoryId,
//     });

//     if (!subcategory) {
//       res
//         .status(400)
//         .json(
//           createErrorJson([
//             { type: "getProducts", msg: "BE_subcategory_not_exsist" },
//           ])
//         );
//       return;
//     }

//     const { subcategoryId } = req.params;
//     const {
//       color,
//       size,
//       sortOption,
//       maxPrice,
//       minPrice,
//       discountPrice,
//       material,
//     } = req.query;

//     // Parsiranje query parametara
//     const min = minPrice ? Number(minPrice) : undefined;
//     const max = maxPrice ? Number(maxPrice) : undefined;
//     const discount = discountPrice === "true";
//     const pageNum = parseInt(req.query.page || "1");
//     const limitNum = parseInt(req.query.limit || "30");
//     const skip = (pageNum - 1) * limitNum;

//     // Filters za product
//     let productFilter: any = {};
//     if (material) productFilter.material = material;
//     if (discount) productFilter.discountPrice = { $gt: 0 };
//     if (min && max) {
//       productFilter.price = { $gt: min, $lt: max };
//     } else if (min) {
//       productFilter.price = { $gt: min };
//     } else if (max) {
//       productFilter.price = { $lt: max };
//     }

//     // Filters za variation
//     const variationFilter: any = {
//       images: { $exists: true, $ne: [] },
//       isActive: true,
//     };
//     if (color) variationFilter.color = color;
//     if (size) {
//       variationFilter.sizes = { $elemMatch: { size } };
//     }

//     // Sort
//     let sortQuery: any = { createdAt: -1 };
//     if (sortOption === "asc") {
//       sortQuery = discount ? { discountPrice: 1 } : { price: 1 };
//     } else if (sortOption === "desc") {
//       sortQuery = discount ? { discountPrice: -1 } : { price: -1 };
//     }

//     // Agregacija
//     const pipeline: any[] = [
//       {
//         $match: {
//           subcategory: { $in: [new mongoose.Types.ObjectId(subcategoryId)] },
//           isActive: true,
//           ...productFilter,
//         },
//       },
//       {
//         $lookup: {
//           from: "productvariants",
//           localField: "variations",
//           foreignField: "_id",
//           as: "variations",
//           pipeline: [
//             { $match: variationFilter },
//             {
//               $project: {
//                 cloudianryIds: 0,
//               },
//             },
//           ],
//         },
//       },
//       { $match: { "variations.0": { $exists: true } } },
//       { $sort: sortQuery },
//       {
//         $facet: {
//           data: [
//             { $skip: skip },
//             { $limit: limitNum },
//             { $project: { createdAt: 0, updatedAt: 0 } },
//           ],
//           totalCount: [{ $count: "count" }],
//         },
//       },
//     ];

//     const result = await Product.aggregate(pipeline);

//     const products = result[0]?.data || [];
//     const total = result[0]?.totalCount[0]?.count || 0;
//     const totalPages = Math.ceil(total / limitNum);

//     const productsDto: ProductDto[] = products.map((p: any) => ({
//       ...p,
//       _id: p._id.toString(),
//       category: p.category.toString(),
//       subcategory: p.subcategory.toString(),
//       variations: p.variations.map((v: any) => ({
//         ...v,
//         _id: v._id.toString(),
//         sizes: v.sizes.map((s: any) => ({
//           ...s,
//           _id: s._id.toString(),
//           isAvailable: s.stock > 0,
//         })),
//       })),
//     }));

//     const productResponseDto: ProductsResponseDto = {
//       page: pageNum,
//       total,
//       totalPages,
//       products: productsDto,
//     };

//     res
//       .status(200)
//       .json(createSuccessJson("BE_get_products_success", productResponseDto));
//   } catch (error: any) {
//     console.error(error);
//     res
//       .status(500)
//       .json(
//         createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
//       );
//   }
// };

//Delete
//use soft delete instead of this
//Delete product and variants
// export const deleteProduct = async (
//   req: Request<{ productId: string }, {}, {}>,
//   res: Response<ApiResponse<null>>
// ) => {
//   try {
//     const productToDelete = await Product.findOneAndDelete({
//       _id: req.params.productId,
//     });

//     if (!productToDelete) {
//       res
//         .status(404)
//         .json(
//           createErrorJson([{ type: "general", msg: "BE_product_not_found" }])
//         );
//       return;
//     }

//     const variants = await ProductVariant.find({
//       product_id: req.params.productId,
//     });

//     if (variants.length === 0) {
//       console.log("No variants for product:", req.params.productId);
//       return;
//     }

//     for (const variant of variants) {
//       if (variant.images && variant.images.length > 0) {
//         await Promise.all(
//           variant.images.map(async (imagePath) => {
//             const fullPath = path.join("uploads", imagePath);
//             try {
//               await fs.promises.unlink(fullPath);
//               console.log("Deleted image:", fullPath);
//             } catch (err) {
//               console.error("Failed to delete image:", err);
//             }
//           })
//         );
//       }

//       if (productToDelete.name && variant.color) {
//         try {
//           await deleteVariantFolder(productToDelete.name, variant.color);
//           console.log(`Deleted folder for variant color: ${variant.color}`);
//         } catch (err) {
//           console.error(
//             `Failed to delete folder for variant color ${variant.color}:`,
//             err
//           );
//         }
//       }
//     }

//     const variantsToDelete = await ProductVariant.deleteMany({
//       product_id: req.params.productId,
//     });
//   } catch (error: any) {
//     res
//       .status(500)
//       .json(
//         createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
//       );
//     return;
//   }
// };

//Get product By Tag
// export const getProductsByTag = async (
//   req: Request<
//     { tag: ProductTag },
//     {},
//     {},
//     {
//       material?: Material;
//       discountPrice?: string;
//       minPrice?: string;
//       maxPrice?: string;
//       color?: BaseColor | ExtendedColor;
//       size?: Size;
//       sortOption?: "asc" | "desc";
//       page?: string;
//       limit?: string;
//     }
//   >,
//   res: Response<ApiResponse<ProductsResponseDto>>
// ) => {
//   try {
//     const { tag } = req.params;
//     const {
//       color,
//       size,
//       sortOption,
//       maxPrice,
//       minPrice,
//       discountPrice,
//       material,
//     } = req.query;

//     // Parsiranje query parametara
//     const min = minPrice ? Number(minPrice) : undefined;
//     const max = maxPrice ? Number(maxPrice) : undefined;
//     const discount = discountPrice === "true";
//     const pageNum = parseInt(req.query.page || "1");
//     const limitNum = parseInt(req.query.limit || "30");
//     const skip = (pageNum - 1) * limitNum;

//     // Filters za product
//     let productFilter: any = {};
//     if (material) productFilter.material = material;
//     if (discount) productFilter.discountPrice = { $gt: 0 };
//     if (min && max) {
//       productFilter.price = { $gt: min, $lt: max };
//     } else if (min) {
//       productFilter.price = { $gt: min };
//     } else if (max) {
//       productFilter.price = { $lt: max };
//     }

//     // Filters za variation
//     const variationFilter: any = {
//       images: { $exists: true, $ne: [] },
//       isActive: true,
//     };
//     if (color) variationFilter.color = color;
//     if (size) {
//       variationFilter.sizes = { $elemMatch: { size } };
//     }

//     // Sort
//     let sortQuery: any = { createdAt: -1 };
//     if (sortOption === "asc") {
//       sortQuery = discount ? { discountPrice: 1 } : { price: 1 };
//     } else if (sortOption === "desc") {
//       sortQuery = discount ? { discountPrice: -1 } : { price: -1 };
//     }

//     // Agregacija
//     const pipeline: any[] = [
//       {
//         $match: {
//           productTag: tag,
//           isActive: true,
//           ...productFilter,
//         },
//       },
//       {
//         $lookup: {
//           from: "productvariants",
//           localField: "variations",
//           foreignField: "_id",
//           as: "variations",
//           pipeline: [
//             { $match: variationFilter },
//             {
//               $project: {
//                 cloudianryIds: 0,
//               },
//             },
//           ],
//         },
//       },
//       { $match: { "variations.0": { $exists: true } } },
//       { $sort: sortQuery },
//       {
//         $facet: {
//           data: [
//             { $skip: skip },
//             { $limit: limitNum },
//             { $project: { createdAt: 0, updatedAt: 0 } },
//           ],
//           totalCount: [{ $count: "count" }],
//         },
//       },
//     ];

//     const result = await Product.aggregate(pipeline);
//     const products = result[0]?.data || [];
//     const total = result[0]?.totalCount[0]?.count || 0;
//     const totalPages = Math.ceil(total / limitNum);

//     const productsDto: ProductDto[] = products.map((p: any) => ({
//       ...p,
//       _id: p._id.toString(),
//       category: p.category.toString(),
//       subcategory: p.subcategory.toString(),
//       variations: p.variations.map((v: any) => ({
//         ...v,
//         _id: v._id.toString(),
//         sizes: v.sizes.map((s: any) => ({
//           ...s,
//           _id: s._id.toString(),
//           isAvailable: s.stock > 0,
//         })),
//       })),
//     }));

//     const productResponseDto: ProductsResponseDto = {
//       page: pageNum,
//       total,
//       totalPages,
//       products: productsDto,
//     };

//     res
//       .status(200)
//       .json(
//         createSuccessJson("BE_get_products_by_tag_success", productResponseDto)
//       );
//   } catch (error: any) {
//     console.error(error);
//     res
//       .status(500)
//       .json(
//         createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
//       );
//   }
// };

// //Delete product variant
// export const deleteProductVariation = async (
//   req: Request<{ variationId: string }, {}, {}>,
//   res: Response<ApiResponse<null>>
// ) => {
//   try {
//     const variantToDelete = await ProductVariant.findOneAndDelete({
//       _id: req.params.variationId,
//     });

//     if (!variantToDelete) {
//       res
//         .status(404)
//         .json(
//           createErrorJson([{ type: "general", msg: "BE_varinant_not_found" }])
//         );
//       return;
//     }

//     const product = await Product.findOne({ _id: variantToDelete.product_id });

//     if (!product) {
//       res
//         .status(404)
//         .json(
//           createErrorJson([{ type: "general", msg: "BE_varinant_not_found" }])
//         );
//       return;
//     }

//     if (variantToDelete.images && variantToDelete.images.length > 0) {
//       await Promise.all(
//         variantToDelete.images.map(async (imagePath) => {
//           const fullPath = path.join("uploads", imagePath);
//           try {
//             await fs.promises.unlink(fullPath);
//             console.log("Deleted image:", fullPath);
//           } catch (err) {
//             console.error("Failed to delete image:", err);
//           }
//         })
//       );
//     }

//     if (product.name && variantToDelete.color) {
//       try {
//         await deleteVariantFolder(product.name, variantToDelete.color);
//         console.log(
//           `Deleted folder for variant color: ${variantToDelete.color}`
//         );
//       } catch (err) {
//         console.error(
//           `Failed to delete folder for variant color ${variantToDelete.color}:`,
//           err
//         );
//       }
//     }
//   } catch (error: any) {
//     res
//       .status(500)
//       .json(
//         createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
//       );
//     return;
//   }
// };
