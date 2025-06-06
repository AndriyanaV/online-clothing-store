import { z } from "zod";
import { Category } from "../../models/category";
import { categoryDto,  UpdateCategoryDto } from "../../types/category";
import mongoose, { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => mongoose.isValidObjectId(val), {
  message: 'Invalid ObjectId',
});

export const addCategoryBodySchema = z.object({
  name: z.string(),
  description: z.string(),
  isMainCategory: z.preprocess(
  (val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return val;
  },
  z.boolean()
),
  subcategories: z
  .array(objectIdSchema)
  .optional()
  .default([]),
}).strict();



export const updateCategorySchema: z.ZodType<UpdateCategoryDto> = z.object({
    name:z.string(),
    description:z.string(),
    isMainCategory:z.boolean(),
    subcategories:z.array(z.custom<Types.ObjectId>()).optional()
}).strict()