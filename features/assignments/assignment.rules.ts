import type { BookingStatus } from "@/lib/constants";

export function canAcceptAssignment(status: string, acceptedAt: Date | null | undefined, bookingStatus: BookingStatus) {
  return status === "ACTIVE" && !acceptedAt && bookingStatus === "ASSIGNED";
}
