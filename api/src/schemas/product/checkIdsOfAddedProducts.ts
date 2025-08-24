import { z } from "zod";
import { objectIdRegex } from "../../constants/common";

export const variationIdsSchema = z
  .object({
    variationIds: z.string().regex(objectIdRegex, "Invalid ObjectId format"),
  })
  .strict();
