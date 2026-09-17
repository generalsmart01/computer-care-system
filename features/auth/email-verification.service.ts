import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  sendAdministratorInvitationEmail,
  sendTechnicianInvitationEmail,
  sendVerificationEmail,
} from "@/features/email/email.service";
import { connectDB } from "@/lib/db";
import { AuthenticationError, NotFoundError } from "@/lib/errors";
import { EmailVerificationToken } from "@/models/EmailVerificationToken";
import { User } from "@/models/User";
import { emailSchema } from "@/lib/validators";
import { technicianPasswordSetupSchema } from "./auth.validation";

const TOKEN_LIFETIME_MS = 30 * 60 * 1000;
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function issueEmailVerification(userId: string) {
  await connectDB();
  const user: any = await User.findOne({
    _id: userId,
    role: "CUSTOMER",
    status: "ACTIVE",
  }).lean();
  if (!user) throw new NotFoundError("Customer account not found");
  if (user.emailVerifiedAt) return { alreadyVerified: true as const };
  const token = randomBytes(32).toString("base64url");
  await EmailVerificationToken.updateMany(
    { userId, purpose: "CUSTOMER_EMAIL_VERIFICATION", usedAt: null },
    { $set: { usedAt: new Date() } },
  );
  await EmailVerificationToken.create({
    userId,
    tokenHash: hashToken(token),
    purpose: "CUSTOMER_EMAIL_VERIFICATION",
    expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
  });
  await sendVerificationEmail(
    user.email,
    `${user.firstName} ${user.lastName}`,
    token,
  );
  return { alreadyVerified: false as const };
}

export async function issueAdministratorInvitation(userId: string) {
  await connectDB();
  const user: any = await User.findOne({
    _id: userId,
    role: "ADMIN",
    status: "ACTIVE",
    mustChangePassword: true,
  }).lean();
  if (!user) throw new NotFoundError("Administrator account not found");
  const token = randomBytes(32).toString("base64url");
  await EmailVerificationToken.updateMany(
    { userId, purpose: "ADMIN_INVITATION", usedAt: null },
    { $set: { usedAt: new Date() } },
  );
  await EmailVerificationToken.create({
    userId,
    tokenHash: hashToken(token),
    purpose: "ADMIN_INVITATION",
    expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
  });
  await sendAdministratorInvitationEmail(
    user.email,
    `${user.firstName} ${user.lastName}`,
    token,
  );
  return { sent: true as const };
}

export async function inspectAdministratorInvitation(token: string) {
  if (!token || token.length > 200) return null;
  await connectDB();
  const record: any = await EmailVerificationToken.findOne({
    tokenHash: hashToken(token),
    purpose: "ADMIN_INVITATION",
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!record) return null;
  const user: any = await User.findOne({
    _id: record.userId,
    role: "ADMIN",
    status: "ACTIVE",
    mustChangePassword: true,
  })
    .select("firstName")
    .lean();
  return user ? { firstName: user.firstName } : null;
}

export async function completeAdministratorInvitation(input: unknown) {
  const data = technicianPasswordSetupSchema.parse(input);
  await connectDB();
  const record: any = await EmailVerificationToken.findOne({
    tokenHash: hashToken(data.token),
    purpose: "ADMIN_INVITATION",
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!record)
    throw new AuthenticationError(
      "This administrator invitation is invalid or has expired",
    );
  const user: any = await User.findOne({
    _id: record.userId,
    role: "ADMIN",
    status: "ACTIVE",
    mustChangePassword: true,
  }).select("+passwordHash");
  if (!user)
    throw new AuthenticationError(
      "This administrator invitation is invalid or has expired",
    );
  user.passwordHash = await bcrypt.hash(data.newPassword, 12);
  user.emailVerifiedAt = new Date();
  user.passwordChangedAt = new Date();
  user.mustChangePassword = false;
  await user.save();
  await EmailVerificationToken.updateMany(
    { userId: user._id, purpose: "ADMIN_INVITATION", usedAt: null },
    { $set: { usedAt: new Date() } },
  );
  return { completed: true as const };
}

export async function resendEmailVerification(input: unknown) {
  const email = emailSchema.parse(input);
  await connectDB();
  const user: any = await User.findOne({
    email,
    role: "CUSTOMER",
    status: "ACTIVE",
  }).lean();
  if (user && !user.emailVerifiedAt)
    await issueEmailVerification(String(user._id));
  return { sent: true as const };
}

export async function verifyEmailToken(token: string) {
  if (!token || token.length > 200)
    throw new AuthenticationError(
      "This verification link is invalid or has expired",
    );
  await connectDB();
  const record: any = await EmailVerificationToken.findOne({
    tokenHash: hashToken(token),
    purpose: "CUSTOMER_EMAIL_VERIFICATION",
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!record)
    throw new AuthenticationError(
      "This verification link is invalid or has expired",
    );
  const user: any = await User.findOne({
    _id: record.userId,
    role: "CUSTOMER",
    status: "ACTIVE",
  });
  if (!user)
    throw new AuthenticationError(
      "This verification link is invalid or has expired",
    );
  if (!user.emailVerifiedAt) {
    user.emailVerifiedAt = new Date();
    await user.save();
  }
  await EmailVerificationToken.updateMany(
    { userId: user._id, purpose: "CUSTOMER_EMAIL_VERIFICATION", usedAt: null },
    { $set: { usedAt: new Date() } },
  );
  return { email: user.email };
}

export async function issueTechnicianInvitation(userId: string) {
  await connectDB();
  const user: any = await User.findOne({
    _id: userId,
    role: "TECHNICIAN",
    status: "ACTIVE",
    mustChangePassword: true,
  }).lean();
  if (!user) throw new NotFoundError("Technician account not found");
  const token = randomBytes(32).toString("base64url");
  await EmailVerificationToken.updateMany(
    { userId, purpose: "TECHNICIAN_INVITATION", usedAt: null },
    { $set: { usedAt: new Date() } },
  );
  await EmailVerificationToken.create({
    userId,
    tokenHash: hashToken(token),
    purpose: "TECHNICIAN_INVITATION",
    expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
  });
  await sendTechnicianInvitationEmail(
    user.email,
    `${user.firstName} ${user.lastName}`,
    token,
  );
  return { sent: true as const };
}

export async function inspectTechnicianInvitation(token: string) {
  if (!token || token.length > 200) return null;
  await connectDB();
  const record: any = await EmailVerificationToken.findOne({
    tokenHash: hashToken(token),
    purpose: "TECHNICIAN_INVITATION",
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!record) return null;
  const user: any = await User.findOne({
    _id: record.userId,
    role: "TECHNICIAN",
    status: "ACTIVE",
    mustChangePassword: true,
  })
    .select("firstName")
    .lean();
  return user ? { firstName: user.firstName } : null;
}

export async function completeTechnicianInvitation(input: unknown) {
  const data = technicianPasswordSetupSchema.parse(input);
  await connectDB();
  const record: any = await EmailVerificationToken.findOne({
    tokenHash: hashToken(data.token),
    purpose: "TECHNICIAN_INVITATION",
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!record)
    throw new AuthenticationError(
      "This technician invitation is invalid or has expired",
    );
  const user: any = await User.findOne({
    _id: record.userId,
    role: "TECHNICIAN",
    status: "ACTIVE",
    mustChangePassword: true,
  }).select("+passwordHash");
  if (!user)
    throw new AuthenticationError(
      "This technician invitation is invalid or has expired",
    );
  user.passwordHash = await bcrypt.hash(data.newPassword, 12);
  user.emailVerifiedAt = new Date();
  user.passwordChangedAt = new Date();
  user.mustChangePassword = false;
  await user.save();
  await EmailVerificationToken.updateMany(
    { userId: user._id, purpose: "TECHNICIAN_INVITATION", usedAt: null },
    { $set: { usedAt: new Date() } },
  );
  return { completed: true as const };
}
