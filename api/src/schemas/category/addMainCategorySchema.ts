import { z } from "zod";
import { Category } from "../../models/category";
import { AddMainCategoryDto } from "../../types/category";
import mongoose, { Types } from "mongoose";

// export const addCategoryBodySchema = z.object({
//   name: z.string(),
//   description: z.string(),
//   isMainCategory: z.preprocess(
//   (val) => {
//     if (val === 'true' || val === true) return true;
//     if (val === 'false' || val === false) return false;
//     return val;
//   },
//   z.boolean()
// ),
//   subcategories: z
//   .array(objectIdSchema)
//   .optional()
//   .default([]),
// }).strict();

export const addMainCategoryBodySchema: z.ZodType<AddMainCategoryDto> = z
  .object({
    name: z.string().max(10),
    description: z.string(),
    isActive: z.boolean(),
  })
  .strict();
