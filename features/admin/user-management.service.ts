import "server-only";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";
import { User } from "@/models/User";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";
import { objectIdSchema } from "@/lib/validators";
import { canChangeUserStatus } from "./user-list.validation";
export async function setUserStatus(
  adminId: string,
  targetId: string,
  nextStatus: "ACTIVE" | "SUSPENDED",
) {
  objectIdSchema.parse(targetId);
  await connectDB();
  const [actor, target] = await Promise.all([
    User.findById(adminId).select("role"),
    User.findById(targetId),
  ]);
  if (!target) throw new NotFoundError("User not found");
  if (!actor || !["ADMIN", "SUPER_ADMIN"].includes(actor.role))
    throw new BusinessRuleError("Administrator access is required");
  if (
    target.role === "SUPER_ADMIN" ||
    (target.role === "ADMIN" && actor.role !== "SUPER_ADMIN")
  )
    throw new BusinessRuleError(
      "Only a super administrator can manage administrator accounts",
    );
  const decision = canChangeUserStatus(
    adminId,
    targetId,
    target.status,
    nextStatus,
  );
  if (!decision.allowed) throw new BusinessRuleError(decision.reason);
  const previousStatus = target.status;
  const changed = await User.findOneAndUpdate(
    { _id: targetId, status: previousStatus },
    { $set: { status: nextStatus } },
    { new: true },
  );
  if (!changed)
    throw new ConflictError(
      "Account status changed while this request was being processed",
    );
  try {
    await AuditLog.create({
      actorId: adminId,
      action: `USER_${nextStatus}`,
      entityType: "User",
      entityId: targetId,
      summary: { previousStatus, nextStatus, role: target.role },
    });
  } catch (error) {
    await User.updateOne(
      { _id: targetId, status: nextStatus },
      { $set: { status: previousStatus } },
    );
    throw error;
  }
  return changed;
}
