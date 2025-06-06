export interface ApiError {
    type: string;
    msg: string;
    // Using only in validation errors
    path?: (string | number)[],
  }
  
  // Global type for all ApiResponses
  // T is the real data of response
  export interface ApiResponse<T = null> {
    errors: {
      type: string;
      msg: string;
    }[];  // Array of errors - can be empty if no errors
    success: {
      message: string;
      data: T | null;  // T is the type of the response data - can be empty if have errors
    };
  }
  
  
  