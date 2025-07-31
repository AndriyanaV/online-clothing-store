import mongoose from "mongoose";
import { User } from "../types/user";
import { role } from "../constants/user";

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
      enum: Object.values(role),
      default: role.user,
    },
  },
  { timestamps: true }
);

const User = mongoose.model(USER_KEY, UserSchema);

export { User };
