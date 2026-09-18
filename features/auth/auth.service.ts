import "server-only";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from "./auth.validation";
import { ConflictError, AuthenticationError } from "@/lib/errors";
import { createSession, destroySession } from "@/lib/auth";
import { issueEmailVerification } from "./email-verification.service";
export async function register(input: unknown) {
  const data = registerSchema.parse(input);
  await connectDB();
  if (await User.exists({ email: data.email }))
    throw new ConflictError(
      "An account with this email already exists. Request another verification email if needed.",
    );
  const user = await User.create({
    ...data,
    password: undefined,
    passwordHash: await bcrypt.hash(data.password, 12),
    role: "CUSTOMER",
    emailVerifiedAt: undefined,
  });
  try {
    await issueEmailVerification(user.id);
  } catch (error) {
    console.error(
      "Customer created but verification email delivery failed",
      error,
    );
    throw new Error(
      "Your account was created, but the verification email could not be sent. Use the resend verification link.",
    );
  }
  return { id: user.id, email: user.email };
}
export async function login(input: unknown, allowedRoles: readonly string[] = ["CUSTOMER"]) {
  const data = loginSchema.parse(input);
  await connectDB();
  const user = await User.findOne({ email: data.email }).select(
    "+passwordHash",
  );
  const valid =
    user && (await bcrypt.compare(data.password, user.passwordHash));
  if (!valid || user.status !== "ACTIVE")
    throw new AuthenticationError("Invalid email or password");
  if (!allowedRoles.includes(user.role))
    throw new AuthenticationError("Invalid email or password");
  if (user.role === "CUSTOMER" && !user.emailVerifiedAt)
    throw new AuthenticationError(
      "Verify your email address before signing in",
    );
  if (user.role === "TECHNICIAN" && user.mustChangePassword)
    throw new AuthenticationError(
      "Complete the technician invitation sent to your email before signing in",
    );
  if (user.role === "ADMIN" && user.mustChangePassword)
    throw new AuthenticationError(
      "Complete the administrator invitation sent to your email before signing in",
    );
  user.lastLoginAt = new Date();
  await user.save();
  await createSession({
    id: user.id,
    role: user.role,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
  });
  return { role: user.role };
}
export async function changePassword(userId: string, input: unknown) {
  const data = changePasswordSchema.parse(input);
  await connectDB();
  const user = await User.findOne({
    _id: userId,
    role: "CUSTOMER",
    status: "ACTIVE",
  }).select("+passwordHash");
  if (!user) throw new AuthenticationError();
  if (!(await bcrypt.compare(data.currentPassword, user.passwordHash)))
    throw new AuthenticationError("Current password is incorrect");
  if (await bcrypt.compare(data.newPassword, user.passwordHash))
    throw new ConflictError(
      "New password must be different from the current password",
    );
  user.passwordHash = await bcrypt.hash(data.newPassword, 12);
  user.passwordChangedAt = new Date();
  await user.save();
  return { changed: true as const };
}
export { destroySession as logout };
