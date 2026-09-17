import "server-only";
import { connectDB } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { Booking } from "@/models/Booking";
import { Device } from "@/models/Device";

export async function assertCustomerBookingAccess(customerId: string, bookingId: string) {
  await connectDB();
  if (!await Booking.exists({ _id: bookingId, customerId })) throw new NotFoundError("Booking not found");
}

export async function getCustomerBooking(customerId: string, bookingId: string) {
  await connectDB();
  const booking = await Booking.findOne({ _id: bookingId, customerId })
    .populate({ path: "deviceId", select: "type brand model serialNumber" })
    .populate({ path: "serviceIds", select: "name slug basePrice" })
    .lean();
  if (!booking) throw new NotFoundError("Booking not found");
  return booking;
}

export async function assertCustomerDeviceAccess(customerId: string, deviceId: string) {
  await connectDB();
  if (!await Device.exists({ _id: deviceId, ownerId: customerId, isActive: true })) throw new NotFoundError("Active device not found");
}

export async function getCustomerDevice(customerId: string, deviceId: string, activeOnly = false) {
  await connectDB();
  const device = await Device.findOne({ _id: deviceId, ownerId: customerId, ...(activeOnly ? { isActive: true } : {}) }).lean();
  if (!device) throw new NotFoundError(activeOnly ? "Active device not found" : "Device not found");
  return device;
}
