import { z } from "zod";
import {
  ProductVariantToUpdateDto,
  SizeInfoToUpdate,
} from "../../types/product";
import { Size } from "../../constants/product";

const SizeInfoToUpdateSchema: z.ZodType<SizeInfoToUpdate> = z.object({
  size: z.nativeEnum(Size).optional(),
  stock: z.number().nonnegative().optional(),
  isAvailable: z.boolean().optional(),
});

export const updateProductVariantInfoBodySchema: z.ZodType<ProductVariantToUpdateDto> =
  z
    .object({
      sizes: z.array(SizeInfoToUpdateSchema).nonempty().optional(),
    })
    .strict();
