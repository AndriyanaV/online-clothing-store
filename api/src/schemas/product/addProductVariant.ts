import { z } from "zod";
import { ProductVariantToAdd } from "../../types/product";
import { BaseColor, ExtendedColor, Size } from "../../constants/product";
import { objectIdRegex } from "../../constants/common";

const SizeInfoSchema = z.object({
  size: z.nativeEnum(Size),
  stock: z.number().int().nonnegative(),
  // isAvailable: z.boolean(),
});

export const productVariantSchema: z.ZodType<ProductVariantToAdd> = z
  .object({
    product_id: z.string().regex(objectIdRegex, "Invalid ObjectId format"),
    color: z.nativeEnum(BaseColor).or(z.nativeEnum(ExtendedColor)),
    sizes: z.array(SizeInfoSchema).nonempty(),
  })
  .strict();
