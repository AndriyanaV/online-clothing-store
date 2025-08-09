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
  ProductBasicInfoToAddDto,
  ProductBySku,
  ProductDto,
  ProductVariantAddedDto,
  ProductVariantDto,
  ProductVariantToAdd,
  ProductVariantToUpdateDto,
  SizeInfo,
  SizeInfoToAdd,
  TagsToAdd,
  VariantSizeInfo,
} from "../types/product";
import { productVariantSchema } from "../schemas/product/addProductVariant";
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
import { ProductTag, productTagsArray } from "../constants/product";
import { addProductTagBodySchema } from "../schemas/product/addProductTag";

//Upload options
let uploadOptions = {
  type: UploadType.MULTIPLE,
  uploadPath: UploadPath.PRODUCT,
  maxFileSize: 5 * 1024 * 1024, // npr 5MB
};

//Add product basic info
export const addProductBasicInfo = [
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

      const subcategory = await Category.findOne({
        _id: req.body.subcategory,
        isMainCategory: false,
      });

      if (!subcategory) {
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
        discountPrice: req.body.discountPrice ? req.body.discountPrice : 0,
        modelCode: req.body.modelCode,
        productTag: req.body.productTag,
        variations: [],
      });

      await newProduct.save();

      console.log("Products main info sucessfully added");

      const id = newProduct._id.toString();

      const addedProductInfo = {
        _id: id,
        name: newProduct.name,
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

//Add product variant basic info
export const addProductVariationInfo = [
  validateRequestWithZod(productVariantSchema),
  async (
    req: Request<{}, {}, ProductVariantToAdd>,
    res: Response<ApiResponse<ProductVariantAddedDto>>
  ) => {
    try {
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

      const sizesWithSKU = req.body.sizes.map((size: SizeInfoToAdd) => ({
        ...size,
        SKU: `${product.modelCode.toUpperCase()}-${req.body.color.toUpperCase()}-${size.size.toUpperCase()}`,
      }));

      const newProductVariant = new ProductVariant({
        product_id: req.body.product_id,
        color: req.body.color,
        sizes: sizesWithSKU,
      });

      await newProductVariant.save();

      console.log("Products variant info sucessfully added");

      if (!product.variations.includes(newProductVariant._id)) {
        product.variations.push(newProductVariant._id);
        await product.save();
      }

      const id = newProductVariant._id.toString();

      const addedProductVariantInfo = {
        _id: id,
        color: newProductVariant.color,
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

//Add product variation image
export const addProductVariationPics = [
  uploadFiles(uploadOptions),

  async (
    req: Request<{ variationId: string; productId: string }, {}, {}>,
    res: Response<ApiResponse<null>>
  ) => {
    try {
      const variation = await ProductVariant.findOne({
        _id: req.params.variationId,
      });

      if (!variation) {
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
        res
          .status(400)
          .json(
            createErrorJson([{ type: "addCategory", msg: "product_not_found" }])
          );
        return;
      }

      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res
          .status(400)
          .json(
            createErrorJson([{ type: "general", msg: "BE_image_not_send" }])
          );
        return;
      }

      let imageUrls: string[] = [];

      imageUrls = files.map((file) =>
        path.relative("uploads", file.path).replace(/\\/g, "/")
      );

      variation.images = variation.images
        ? [...variation.images, ...imageUrls]
        : imageUrls;

      await variation.save();

      res
        .status(200)
        .json(createSuccessJson("BE_variant_image_added_sucessfully", null));
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

//Update

//Update basic info about product
export const updateProductBasicInfo = [
  validateRequestWithZod(updateProductBasicInfoBodySchema),
  async (
    req: Request<{ productId: string }, {}, ProductBasicInfoToAddDto>,
    res: Response<ApiResponse<null>>
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
        ? new mongoose.Types.ObjectId(req.body.subcategory)
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

      await product.save();

      console.log("Products main info sucessfully updated");

      res
        .status(200)
        .json(
          createSuccessJson("BE_product_basic_info_updated_successfully", null)
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
    res: Response<ApiResponse<null>>
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

      const updatedVariant = await ProductVariant.findByIdAndUpdate(
        req.params.variantId,
        {
          sizes: updatedSizes,
        },
        { new: true, runValidators: true }
      );

      console.log("Variant main info sucessfully updated");

      res
        .status(200)
        .json(
          createSuccessJson("BE_variant_basic_info_updated_successfully", null)
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

//Update variant image
export const updateProductVariationPics = [
  uploadFiles(uploadOptions),

  async (
    req: Request<{ variationId: string }, {}>,
    res: Response<ApiResponse<null>>
  ) => {
    try {
      const variation = await ProductVariant.findOne({
        _id: new Types.ObjectId(req.params.variationId),
      });

      if (!variation) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addCategory", msg: "BE_variation_not_found" },
            ])
          );
        return;
      }

      const files = req.files as Express.Multer.File[];

      if (files.length === 0 && !files) {
        res
          .status(400)
          .json(createErrorJson([{ type: "general", msg: "No_image" }]));
        return;
      }

      let newImagesUrls: string[] = [];
      const oldImagesUrls = variation.images;

      newImagesUrls = files.map((file) =>
        path.relative("uploads", file.path).replace(/\\/g, "/")
      );

      variation.images = newImagesUrls;

      if (oldImagesUrls) {
        await Promise.all(
          oldImagesUrls.map(async (oldImagePath) => {
            const fullOldPath = path.join("uploads", oldImagePath);
            try {
              await fs.promises.unlink(fullOldPath);
              console.log("Old image deleted:", fullOldPath);
            } catch (err) {
              console.error("Failed to delete old image:", err);
            }
          })
        );
      }

      await variation.save();

      res
        .status(200)
        .json(createSuccessJson("BE_variant_picture_added_sucessfully", null));
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

//Read
export const getAllproductsBySubcategory = async (
  req: Request<{ subcategoryId: string }, {}, {}>,
  res: Response<ApiResponse<ProductDto[]>>
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
            { type: "getProducts", msg: "BE_subcategory_not_exsist" },
          ])
        );
      return;
    }

    const products = await Product.find({
      subcategory: req.params.subcategoryId,
      variations: { $exists: true, $not: { $size: 0 } },
    })
      .select("-createdAt -updatedAt")
      .populate("variations")
      .lean();

    const productsDto: ProductDto[] = products.map((p) => ({
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

    res
      .status(200)
      .json(
        createSuccessJson(
          "BE_get_main_category_subcategories_success",
          productsDto
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

//get product
export const getProduct = async (
  req: Request<{ productId: string }, {}, {}>,
  res: Response<ApiResponse<ProductDto>>
) => {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
    });

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

    const returnedProduct = await Product.findOne({
      _id: req.params.productId,
    })
      .select("-createdAt -updatedAt")
      .populate("variations")
      .lean();

    if (!returnedProduct) {
      res
        .status(400)
        .json(
          createErrorJson([
            { type: "getProducts", msg: "BE_product_not_exsist" },
          ])
        );
      return;
    }

    const productDto: ProductDto = {
      ...returnedProduct,
      _id: returnedProduct._id.toString(),
      category: returnedProduct.category.toString(),
      subcategory: returnedProduct.subcategory.toString(),
      variations: returnedProduct.variations.map((v: any) => ({
        ...v,
        _id: v._id.toString(),
        sizes: v.sizes.map((s: any) => ({
          ...s,
          _id: s._id.toString(),
          isAvailable: s.stock > 0,
        })),
      })),
    };

    res
      .status(200)
      .json(createSuccessJson("BE_get_product_success", productDto));
  } catch (error: any) {
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

//get product variation by SKU
export const getProductVariantBySku = async (
  req: Request<{ sku: string }, {}, {}>,
  res: Response<ApiResponse<ProductBySku>>
) => {
  try {
    const productVariantToFind = await ProductVariant.findOne(
      { "sizes.SKU": req.params.sku }, // filtriraj po SKU
      {
        sizes: { $elemMatch: { SKU: req.params.sku } }, // vrati samo tu veličinu
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

//get
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

//Add product tag
export const addTagsToProduct = [
  validateRequestWithZod(addProductTagBodySchema),
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

      const existingTags = new Set(product.productTag);
      for (const tag of tagsToAdd) {
        if (!existingTags.has(tag)) {
          product.productTag.push(tag);
        }
      }

      await product.save();

      res.status(200).json(createSuccessJson("BE_tag_added_sucessfully", null));
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
