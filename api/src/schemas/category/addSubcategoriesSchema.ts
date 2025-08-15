import { z } from "zod";
import { AddSubcategoryDto } from "../../types/category";

export const addSubcategoryBodySchema: z.ZodType<AddSubcategoryDto> = z
  .object({
    name: z.string().max(10),
    description: z.string(),
    isActive: z.boolean(),
  })
  .strict();
