import {z} from 'zod';
import RegistrationBody from '../../types/auth';
import { MIN_PASSWORD_LEN } from '../../constants/common';

export const registerSchemaRules: z.ZodType<RegistrationBody> = z.object({
    email: z.string()
        .email({ message: 'BE_invalid_email' }), // Error message for invalid email
    password: z.string()
        .min(MIN_PASSWORD_LEN, { message: 'BE_password_too_short' }), // Error message for short password,
    // Adding only one phone on register 
    firstName: z.string().min(1).max(50).default('').optional(),
    lastName: z.string().min(1).max(50).default('').optional(),
}).strict()