import { z } from "zod";
import { ProductVariantToUpdate } from "../../types/product";

export const updateProductVariantInfoBodySchema: z.ZodType<ProductVariantToUpdate> =
  z
    .object({
      stock: z.number().int().nonnegative().optional(),
      isAvailable: z.boolean().default(true).optional(),
    })
    .strict();
