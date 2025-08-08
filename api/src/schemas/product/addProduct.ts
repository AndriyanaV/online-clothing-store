import { z } from "zod";
import {
  BaseColor,
  CareInstructions,
  CountryBrand,
  ExtendedColor,
  Material,
  ProductTag,
  Size,
} from "../../constants/product";
import mongoose, { Types } from "mongoose";
import { ProductBasicInfoToAddDto } from "../../types/product";
import { objectIdRegex } from "../../constants/common";

export const addProductBasicInfoBodySchema: z.ZodType<ProductBasicInfoToAddDto> =
  z
    .object({
      name: z.string().min(1, "Name is required"),
      description: z.string().min(1, "Description is required"),
      material: z.nativeEnum(Material),
      category: z.string().regex(objectIdRegex, "Invalid ObjectId format"),
      subcategory: z.string().regex(objectIdRegex, "Invalid ObjectId format"),
      careInstructions: z.nativeEnum(CareInstructions),
      countryBrand: z.nativeEnum(CountryBrand),
      price: z.number().positive("Price must be positive"),
      discountPrice: z
        .number()
        .nonnegative("Discount must be zero or positive")
        .optional()
        .default(0),
      modelCode: z.string().min(1).max(30),
      productTag: z.array(z.nativeEnum(ProductTag)).optional().default([]),
    })
    .strict();
