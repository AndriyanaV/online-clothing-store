import { z } from "zod";
import { Size } from "../../constants/product";
import { SizeInfoToAdd } from "../../types/product";

export const addVariationSizeBodySchema: z.ZodType<SizeInfoToAdd> = z
  .object({
    size: z.nativeEnum(Size),
    stock: z.number().int().nonnegative(),
  })
  .strict();
