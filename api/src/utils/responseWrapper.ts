import { ApiError } from "../types/common";

export const createErrorJson = (errors: ApiError[]) => {
    return {
        errors: errors,
        success: {
            message: '',
            data: null
        }
    };
}

export const createSuccessJson = <T>(msg: string, data: T) => {
    return {
        errors: [],
        success: {
            message: msg,
            data: data
        }
    };
}