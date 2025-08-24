import { z } from "zod";
import { UpdateSubcategoryDto } from "../../types/category";

export const updateSubcategoryBodySchema: z.ZodType<UpdateSubcategoryDto> = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
