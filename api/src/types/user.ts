import { ObjectId } from "mongodb";
import { role } from "../constants/user";

export interface User {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: role;
  // Token which using for email verification
  verificationToken?: string;
  verificationTokenExpires: Date;
  // Default false
  verifiedEmail: boolean;
  resetPasswordToken: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// export interface publicUser {
//   email: string;
//   firstName?: string;
//   lastName?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
//   _id: string;  // Promeni _id u string
//   __v: number;
// }

export interface UserDto extends User {
  _id: string;
}

export interface UserInfo
  extends Partial<Pick<User, "email" | "firstName" | "lastName" | "role">> {}

export interface UpdateUserBody
  extends Partial<Pick<User, "firstName" | "lastName">> {}

// Same as IUser but without password
export interface IUserPublic extends Omit<UserDto, "password"> {}

export type PublicUser = Omit<
  UserDto,
  "password" | "createdAt" | "updatedAt" | "verifiedEmail" | "verificationToken"
>;
