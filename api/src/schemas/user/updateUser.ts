import { z } from "zod";
import { UserInfo, User, UpdateUserBody} from "../../types/user";


export const updateUserBodySchema: z.ZodType<UpdateUserBody> = z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),   
}).strict()