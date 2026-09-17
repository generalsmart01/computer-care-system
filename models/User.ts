import mongoose, { Schema } from "mongoose";
import { USER_ROLES, USER_STATUSES } from "@/lib/constants";
const schema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: String,
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: "CUSTOMER", index: true },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: "ACTIVE",
      index: true,
    },
    avatarUrl: String,
    emailVerifiedAt: Date,
    mustChangePassword: { type: Boolean, default: false },
    passwordChangedAt: Date,
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_d, r) {
        delete (r as Record<string, unknown>).passwordHash;
        return r;
      },
    },
  },
);
export const User: mongoose.Model<any> =
  mongoose.models.User || mongoose.model("User", schema);
