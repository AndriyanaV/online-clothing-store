// import { z } from "zod";
// import { BaseColor, ExtendedColor } from "../../constants/product";
// import { ValidateVariantInfoBeforeUpload } from "../../types/product";
// import { objectIdRegex } from "../../constants/common";

// const CombinedColors = { ...BaseColor, ...ExtendedColor };
// const combinedColorsArr = Object.values(CombinedColors);

// export const validateVarinatInfoBeforeImgUploadBodySchema: z.ZodType<ValidateVariantInfoBeforeUpload> = z.object({
//     product_id:z.string().regex(objectIdRegex, "Invalid ObjectId format"),
//    color:z.nativeEnum(CombinedColors),
//    name:z.string().min(1, "Name is required")
// }).strict()

// export const validateVarinatInfoBeforeImgUploadBodySchema = z.object({
//   product_id: z.string().regex(objectIdRegex, 'Invalid ObjectId format'),
//   color: z.enum(combinedColorsArr as [string, ...string[]]),
//   name: z.string().min(1, 'Name is required'),
  
// }).strict();