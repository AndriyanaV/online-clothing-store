import { ApiError } from "../types/common";

// export const createErrorJson = (errors: ApiError[]) => {
//     return {
//         errors: errors,
//         success: {
//             message: '',
//             data: null
//         }
//     };
// }
export const createErrorJson = (errors: ApiError[], data: any = null) => {
  return {
    errors: errors,
    success: {
      message: "",
      data: data, // sada može da pošalješ opciono bilo šta
    },
  };
};

export const createSuccessJson = <T>(msg: string, data: T) => {
  return {
    errors: [],
    success: {
      message: msg,
      data: data,
    },
  };
};
