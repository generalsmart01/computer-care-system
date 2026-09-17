import "server-only";
import type { UserRole } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import {
  assertAcceptedAssignment,
  assertAssigned,
} from "@/features/assignments/assignment.service";
import { AuditLog } from "@/models/AuditLog";
import { Booking } from "@/models/Booking";
import { Diagnosis } from "@/models/Diagnosis";
import { Notification } from "@/models/Notification";
import { Quotation } from "@/models/Quotation";
import {
  AuthorizationError,
  BusinessRuleError,
  NotFoundError,
} from "@/lib/errors";
import { calculateQuotation } from "./calculation";
import { quotationBuilderSchema } from "./quotation-builder.validation";
import { sendLifecycleEmail } from "@/features/email/email.service";

export async function buildQuotation(
  actor: { id: string; role: UserRole },
  bookingId: string,
  input: unknown,
) {
  await connectDB();
  if (actor.role === "TECHNICIAN") {
    await assertAssigned(bookingId, actor.id);
    await assertAcceptedAssignment(bookingId, actor.id);
  } else if (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")
    throw new AuthorizationError();
  const parsed = quotationBuilderSchema.parse(input),
    [booking, diagnosis] = await Promise.all([
      Booking.findById(bookingId),
      Diagnosis.findOne({
        _id: parsed.diagnosisId,
        bookingId,
        status: { $in: ["SUBMITTED", "APPROVED"] },
      }),
    ]);
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.status !== "AWAITING_APPROVAL")
    throw new BusinessRuleError(
      "A quotation can be prepared only while awaiting approval",
    );
  if (!diagnosis) throw new NotFoundError("Submitted diagnosis not found");
  const calculated = calculateQuotation({
      items: parsed.items,
      discount: parsed.discount,
    }),
    previous = await Quotation.findOne({ bookingId, status: "PENDING" }).sort({
      version: -1,
    }),
    last: any = await Quotation.findOne({ bookingId })
      .sort({ version: -1 })
      .select("version")
      .lean();
  const quotation = await Quotation.create({
    ...calculated,
    bookingId,
    diagnosisId: diagnosis.id,
    createdBy: actor.id,
    validUntil: parsed.validUntil,
    version: (last?.version || 0) + 1,
    status: "DRAFT",
  });
  try {
    if (previous) {
      previous.status = "REPLACED";
      await previous.save();
    }
    quotation.status = "PENDING";
    await quotation.save();
    await AuditLog.create({
      actorId: actor.id,
      action: "QUOTATION_CREATED",
      entityType: "Quotation",
      entityId: quotation.id,
      summary: {
        bookingId,
        version: quotation.version,
        total: quotation.total,
      },
    });
  } catch (error) {
    await Quotation.deleteOne({
      _id: quotation.id,
      status: { $in: ["DRAFT", "PENDING"] },
    });
    if (previous) {
      previous.status = "PENDING";
      await previous.save();
    }
    throw error;
  }
  try {
    await Notification.create({
      userId: booking.customerId,
      bookingId,
      type: "QUOTATION_READY",
      title: "Quotation ready",
      message: `Quotation v${quotation.version} for ${booking.reference} is ready for review.`,
    });
  } catch (error) {
    console.error("Quotation created but notification failed", error);
  }
  try {
    await sendLifecycleEmail(
      String(booking.customerId),
      "QUOTATION_READY",
      bookingId,
      booking.reference,
      `Quotation version ${quotation.version} totals $${quotation.total.toFixed(2)}.`,
    );
  } catch (error) {
    console.error("Quotation created but email delivery failed", error);
  }
  return quotation;
}
