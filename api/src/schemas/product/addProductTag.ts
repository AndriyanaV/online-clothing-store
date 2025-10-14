import { nativeEnum, z } from "zod";
import { ProductTag } from "../../constants/product";
import { TagsToAdd } from "../../types/product";

export const addProductTagsBodySchema: z.ZodType<TagsToAdd> = z
  .object({
    tags: z.array(nativeEnum(ProductTag)),
  })
  .strict();
