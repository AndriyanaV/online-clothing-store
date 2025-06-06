import { LoginBody } from "../../types/auth"
import {z} from 'zod'
import { MIN_PASSWORD_LEN } from "../../constants/common"

export const loginSchemaRules: z.ZodType<LoginBody>= z.object({
    email:z.string().email('BE_valid_email'),
    password:z.string().min(MIN_PASSWORD_LEN, 'BE_valid_password')
}).strict('BE_unrecogized_fiends');


   
