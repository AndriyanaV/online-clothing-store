import { z } from "zod";
import { ProductBasicInfoToUpdateDto } from "../../types/product";
import {
  CareInstructions,
  CountryBrand,
  Material,
  ProductTag,
} from "../../constants/product";
import { objectIdRegex } from "../../constants/common";

export const updateProductBasicInfoBodySchema: z.ZodType<ProductBasicInfoToUpdateDto> =
  z
    .object({
      name: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      material: z.nativeEnum(Material).optional(),
      category: z.string().regex(objectIdRegex).optional(),
      subcategory: z
        .array(z.string().regex(objectIdRegex, "Invalid ObjectId format"))
        .optional(),
      careInstructions: z.nativeEnum(CareInstructions).optional(),
      countryBrand: z.nativeEnum(CountryBrand).optional(),
      price: z.number().positive().optional(),
      discountPrice: z.number().nonnegative().optional(),
      productTag: z.array(z.nativeEnum(ProductTag)).optional(),
      isActive: z.boolean().optional(),
    })
    .strict();
