import { z } from "zod";
import { addProductVariantPicture } from "../../types/product";
import { objectIdRegex } from "../../constants/common";
import { BaseColor, ExtendedColor } from "../../constants/product";

export const addProductVariantPhotoBodySchema: z.ZodType<addProductVariantPicture> = z.object({
   product_id:z.string().regex(objectIdRegex, "Invalid ObjectId format"),
   color:z.nativeEnum(BaseColor).or(z.nativeEnum(ExtendedColor)),
   name:z.string().min(1, "Name is required")
}).strict()