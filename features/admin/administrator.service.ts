import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { connectDB } from "@/lib/db";
import { ConflictError } from "@/lib/errors";
import { AuditLog } from "@/models/AuditLog";
import { EmailVerificationToken } from "@/models/EmailVerificationToken";
import { User } from "@/models/User";
import { issueAdministratorInvitation } from "@/features/auth/email-verification.service";
import { createAdministratorSchema } from "./administrator.validation";

export async function createAdministrator(actorId: string, input: unknown) {
  const data = createAdministratorSchema.parse(input);
  await connectDB();
  if (await User.exists({ email: data.email }))
    throw new ConflictError("An account with this email already exists");
  let user: any, audit: any;
  try {
    user = await User.create({
      ...data,
      phone: data.phone || undefined,
      passwordHash: await bcrypt.hash(
        randomBytes(48).toString("base64url"),
        12,
      ),
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: undefined,
      mustChangePassword: true,
    });
    audit = await AuditLog.create({
      actorId,
      action: "ADMINISTRATOR_CREATED",
      entityType: "User",
      entityId: user.id,
      summary: { role: "ADMIN" },
    });
    await issueAdministratorInvitation(user.id);
    return user;
  } catch (error) {
    if (audit) await AuditLog.deleteOne({ _id: audit.id });
    if (user) {
      await EmailVerificationToken.deleteMany({
        userId: user.id,
        purpose: "ADMIN_INVITATION",
      });
      await User.deleteOne({ _id: user.id, role: "ADMIN" });
    }
    throw error;
  }
}
