import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { loadEnvConfig } from "@next/env";
import { User } from "../models/User";
import { passwordSchema } from "../lib/validators";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const { MONGODB_URI } = process.env;
  const email = process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const password =
    process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!MONGODB_URI || !email || !password) {
    throw new Error(
      "MONGODB_URI, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required. Pass them to the command or configure the target environment.",
    );
  }
  const normalizedEmail = email.trim().toLowerCase();
  const parsedPassword = passwordSchema.parse(password);

  await mongoose.connect(MONGODB_URI);
  try {
    const existing = await User.findOne({ email: normalizedEmail }).select(
      "role",
    );
    if (existing && !["ADMIN", "SUPER_ADMIN"].includes(existing.role))
      throw new Error(
        "That email belongs to a non-administrator account and cannot be promoted by the bootstrap script",
      );
    await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          firstName: "System",
          lastName: "Administrator",
          email: normalizedEmail,
          passwordHash: await bcrypt.hash(parsedPassword, 12),
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
          mustChangePassword: false,
        },
      },
      { upsert: true },
    );
  } finally {
    await mongoose.disconnect();
  }

  console.log(`Super administrator created or updated: ${normalizedEmail}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
