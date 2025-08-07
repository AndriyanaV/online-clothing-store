import { z } from "zod";
import { ProductVariantToUpdateDto, SizeInfo } from "../../types/product";
import { Size } from "../../constants/product";

const SizeInfoToUpdateSchema: z.ZodType<SizeInfo> = z.object({
  size: z.nativeEnum(Size),
  stock: z.number().nonnegative(),
});

export const updateProductVariantInfoBodySchema: z.ZodType<ProductVariantToUpdateDto> =
  z
    .object({
      sizes: z.array(SizeInfoToUpdateSchema).nonempty(),
    })
    .strict();
