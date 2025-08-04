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
  ProductVariantAddedDto,
  ProductVariantDto,
  ProductVariantToAdd,
  ProductVariantToUpdateDto,
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

// Podešavaš opcije za upload
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
      const product = await Product.findOne({ name: req.body.name });

      if (product) {
        res
          .status(400)
          .json(
            createErrorJson([
              { type: "addProduct", msg: "BE_product_already_exists" },
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
        discountPrice: req.body.discountPrice,
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

      const product = await Product.findOne({
        _id: req.body.product_id,
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

      const newProductVariant = new ProductVariant({
        product_id: req.body.product_id,
        color: req.body.color,
        sizes: req.body.sizes,
        hasImages: false,
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

//Add product variant image
export const addProductVariationPics = [
  uploadFiles(uploadOptions),

  async (
    req: Request<
      { variationId: string; productId: string },
      {},
      addProductVariantPicture
    >,
    res: Response<ApiResponse<null>>
  ) => {
    try {
      const variation = await ProductVariant.findOne({
        _id: new Types.ObjectId(req.params.variationId),
      });
      const productId = req.params.productId;

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

      let imageUrls: string[] = [];

      if (files && files.length > 0) {
        imageUrls = files.map((file) =>
          path.relative("uploads", file.path).replace(/\\/g, "/")
        );

        variation.images = variation.images
          ? [...variation.images, ...imageUrls]
          : imageUrls;

        const product = await Product.findOne({
          _id: new Types.ObjectId(req.params.productId),
        });

        if (!product) {
          res
            .status(400)
            .json(
              createErrorJson([
                { type: "addCategory", msg: "product_not_found" },
              ])
            );
          return;
        }

        // await variation.save();

        // if (!product.variations.includes(variation._id)) {
        //   product.variations.push(variation._id);
        //   await product.save();
        // }

        variation.hasImages = true;

        await variation.save();

        res
          .status(200)
          .json(
            createSuccessJson("BE_variant_picture_added_sucessfully", null)
          );
        return;
      }
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

//Update basic info about product
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

      const updateData = req.body;

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

      const updatedVariant = await ProductVariant.findByIdAndUpdate(
        req.params.variantId,
        updateData,
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
