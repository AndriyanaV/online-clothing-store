import { z } from "zod";
import { VerifyEmailAgainBody } from "../../types/auth";

export const verifyEmailBodySchema: z.ZodType<VerifyEmailAgainBody> = z.object({
  email: z.string().email({ message: "BE_invalid_email" }),
});
