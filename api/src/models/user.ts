import mongoose from "mongoose";
import { User } from "../types/user";
import { UserRole } from "../constants/user";

const Schema = mongoose.Schema;

export const USER_KEY = "User";

const UserSchema = new Schema<User>(
  {
    // Ovo dodaje Mongodb sam _id
    // _id:{ type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.user,
    },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    verifiedEmail: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model(USER_KEY, UserSchema);

export { User };
