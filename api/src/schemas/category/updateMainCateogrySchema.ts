import { z } from "zod";
import { UpdateMainCategoryDto } from "../../types/category";
import { Types } from "mongoose";

export const updateMainCategoryBodySchema: z.ZodType<UpdateMainCategoryDto> = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
