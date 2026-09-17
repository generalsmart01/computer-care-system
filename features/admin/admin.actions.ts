"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import { transitionBooking } from "@/features/bookings/status.service";
import { canAdminTransition } from "@/features/bookings/admin-transitions";
import type { BookingStatus } from "@/lib/constants";
import { Booking } from "@/models/Booking";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import { Notification } from "@/models/Notification";
import { bookingStatusNotification } from "@/features/notifications/notification-events";
import { setUserStatus } from "@/features/admin/user-management.service";
import { sendLifecycleEmail } from "@/features/email/email.service";

export async function adminTransitionAction(id: string, to: BookingStatus, form: FormData) {
  const user = await requireAdmin();
  await connectDB();
  const booking:any = await Booking.findById(id).select("status customerId reference").lean();
  if (!booking) throw new NotFoundError("Booking not found");
  if (!canAdminTransition(booking.status as BookingStatus, to)) throw new BusinessRuleError("This transition is not an available admin intake action");
  const reason = String(form.get("reason") || "").trim();
  if (to === "REJECTED" && reason.length < 5) throw new BusinessRuleError("A rejection reason of at least five characters is required");
  const extra = to === "REJECTED" ? { rejection: { rejectedBy: user.id, reason, rejectedAt: new Date() } } : {};
  await transitionBooking(id, to, user.id, reason || undefined, extra);
  if(to==="CONFIRMED"||to==="REJECTED"){try{await Notification.create({userId:booking.customerId,bookingId:id,...bookingStatusNotification(to,booking.reference,reason)})}catch(error){console.error("Admin transition saved but customer notification failed",error)}}
  if(to==="CONFIRMED")try{await sendLifecycleEmail(String(booking.customerId),"BOOKING_CONFIRMED",id,booking.reference)}catch(error){console.error("Booking confirmed but email delivery failed",error)}
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
}

export async function setUserStatusAction(id: string, status: "ACTIVE" | "SUSPENDED") {
  const user = await requireAdmin();
  await setUserStatus(user.id,id,status);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
}
