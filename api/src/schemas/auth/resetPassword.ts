import { z, ZodObject, ZodType } from "zod";
import { ResetPasswordBody } from "../../types/auth";
import { MIN_PASSWORD_LEN } from "../../constants/common";

export const resetPasswordBodySchema: z.ZodType<ResetPasswordBody> = z
  .object({
    password: z.string().min(MIN_PASSWORD_LEN, "BE_password_too_short"),
    confirmedPassword: z
      .string()
      .min(MIN_PASSWORD_LEN, "BE_password_too_short"),
    token: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmedPassword, {
    message: "BE_passwords_do_not_match",
    path: ["confirmPassword"], // set path of error
  });
