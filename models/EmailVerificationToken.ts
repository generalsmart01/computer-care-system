import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    purpose: {
      type: String,
      enum: [
        "CUSTOMER_EMAIL_VERIFICATION",
        "TECHNICIAN_INVITATION",
        "ADMIN_INVITATION",
      ],
      required: true,
      index: true,
    },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    usedAt: Date,
  },
  { timestamps: true },
);

schema.index({ userId: 1, purpose: 1, usedAt: 1 });

export const EmailVerificationToken: mongoose.Model<any> =
  mongoose.models.EmailVerificationToken ||
  mongoose.model("EmailVerificationToken", schema);
