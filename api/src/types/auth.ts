import { StringValidation } from "zod";
import { User, IUserPublic } from "./user";

// Koristi se u middleware za token i za chekc login user
export interface IUserPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

export default interface RegistrationBody
  extends Omit<
    User,
    | "createdAt"
    | "updatedAt"
    | "role"
    | "verifiedEmail"
    | "verifiedEmail"
    | "verificationTokenExpires"
    | "resetPasswordToken"
  > {}

// Extend login response because we can login user on registration
export interface RegistrationResponse extends LoginResponse {}

export interface LoginResponse {
  user: IUserPublic;
  token: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface VerifyEmailAgainBody {
  email: string;
}

export interface ResetPasswordBody {
  password: string;
  confirmedPassword: string;
  token: string;
}
