import type { BookingStatus } from "@/lib/constants";

export const ADMIN_BOOKING_TRANSITIONS: Partial<Record<BookingStatus, readonly BookingStatus[]>> = {
  PENDING: ["CONFIRMED", "REJECTED"],
  CONFIRMED: ["AWAITING_DEVICE"],
  AWAITING_DEVICE: ["RECEIVED"],
};

export function canAdminTransition(from: BookingStatus, to: BookingStatus) {
  return ADMIN_BOOKING_TRANSITIONS[from]?.includes(to) ?? false;
}
