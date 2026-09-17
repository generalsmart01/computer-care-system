import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ user: null as null | { id: string; name: string; email: string; role: "CUSTOMER" | "TECHNICIAN" | "ADMIN" } }));
vi.mock("@/lib/auth", () => ({ getSession: vi.fn(async () => session.user), createSession: vi.fn(), destroySession: vi.fn() }));
vi.mock("@/features/email/email.service", () => ({ sendLifecycleEmail: vi.fn().mockResolvedValue({ sent: true }) }));

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { assertCustomerBookingAccess, assertCustomerDeviceAccess } from "@/features/security/resource-access.service";
import { assertAssigned } from "@/features/assignments/assignment.service";
import { assignTechnicianAction } from "@/features/assignments/assignment.actions";
import { adminTransitionAction } from "@/features/admin/admin.actions";
import { createBooking } from "@/features/bookings/booking.service";
import { respondToQuotation } from "@/features/quotations/response.service";
import { saveRepairTracking } from "@/features/repairs/repair-tracking.service";
import { User } from "@/models/User";
import { Device } from "@/models/Device";
import { Service } from "@/models/Service";
import { Booking } from "@/models/Booking";
import { Assignment } from "@/models/Assignment";
import { Quotation } from "@/models/Quotation";
import { RepairReport } from "@/models/RepairReport";

let customerA = "", customerB = "", technicianA = "", technicianB = "", admin = "";
let deviceB = "", bookingB = "", activeService = "", inactiveService = "";

describe.sequential("Phase 60 adversarial security boundaries", () => {
  beforeAll(async () => {
    await connectDB();
    await mongoose.connection.db!.dropDatabase();
    const passwordHash = await bcrypt.hash("ValidPass123", 4);
    const users = await User.create([
      { firstName: "Customer", lastName: "Alpha", email: "alpha.security@example.test", passwordHash, role: "CUSTOMER" },
      { firstName: "Customer", lastName: "Beta", email: "beta.security@example.test", passwordHash, role: "CUSTOMER" },
      { firstName: "Tech", lastName: "Alpha", email: "tech-alpha.security@example.test", passwordHash, role: "TECHNICIAN" },
      { firstName: "Tech", lastName: "Beta", email: "tech-beta.security@example.test", passwordHash, role: "TECHNICIAN" },
      { firstName: "Admin", lastName: "User", email: "admin.security@example.test", passwordHash, role: "ADMIN" },
    ]);
    [customerA, customerB, technicianA, technicianB, admin] = users.map(user => user.id);
    const device = await Device.create({ ownerId: customerB, type: "LAPTOP", brand: "Dell", model: "Latitude", serialNumber: "SECURITY-B" });
    deviceB = device.id;
    const services = await Service.create([
      { name: "Active security service", slug: "active-security-service", category: "HARDWARE_REPAIR", shortDescription: "Active service used by security tests.", description: "Active service used by adversarial integration security tests.", basePrice: 50, isActive: true },
      { name: "Inactive security service", slug: "inactive-security-service", category: "HARDWARE_REPAIR", shortDescription: "Inactive service used by security tests.", description: "Inactive service used by adversarial integration security tests.", basePrice: 50, isActive: false },
    ]);
    [activeService, inactiveService] = services.map(service => service.id);
    const booking = await Booking.create({ customerId: customerB, deviceId: deviceB, serviceIds: [activeService], reference: "CMB-2026-900001", problemTitle: "Security fixture", problemDescription: "A fixture booking for ownership and authorization checks.", symptoms: [], imageUrls: [], serviceMethod: "WALK_IN", preferredDate: new Date(Date.now() + 86_400_000), preferredTimeSlot: "09:00-11:00", basePriceSnapshot: 50, status: "ASSIGNED" });
    bookingB = booking.id;
    await Assignment.create({ bookingId: bookingB, technicianId: technicianB, assignedBy: admin, acceptedAt: new Date() });
  });

  afterAll(async () => {
    if (mongoose.connection.db) await mongoose.connection.db.dropDatabase();
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });

  it("hides Customer B's booking from Customer A", async () => {
    await expect(assertCustomerBookingAccess(customerA, bookingB)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("hides Customer B's device from Customer A", async () => {
    await expect(assertCustomerDeviceAccess(customerA, deviceB)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("denies Technician A access to Technician B's job", async () => {
    await expect(assertAssigned(bookingB, technicianA)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("denies a customer the admin role boundary", async () => {
    session.user = { id: customerA, name: "Customer Alpha", email: "alpha.security@example.test", role: "CUSTOMER" };
    await expect(requireAdmin()).rejects.toMatchObject({ statusCode: 403 });
  });

  it("denies a technician performing an admin assignment", async () => {
    session.user = { id: technicianA, name: "Tech Alpha", email: "tech-alpha.security@example.test", role: "TECHNICIAN" };
    const form = new FormData(); form.set("technicianId", technicianA);
    await expect(assignTechnicianAction(bookingB, {}, form)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("denies a customer directly changing booking status", async () => {
    session.user = { id: customerA, name: "Customer Alpha", email: "alpha.security@example.test", role: "CUSTOMER" };
    await expect(adminTransitionAction(bookingB, "DIAGNOSING", new FormData())).rejects.toMatchObject({ statusCode: 403 });
    expect((await Booking.findById(bookingB))!.status).toBe("ASSIGNED");
  });

  it("rejects quotation-total tampering and preserves the server total", async () => {
    const quotation = await Quotation.create({ bookingId: bookingB, diagnosisId: new mongoose.Types.ObjectId(), createdBy: technicianB, items: [{ description: "Labour", type: "LABOUR", quantity: 1, unitPrice: 100, amount: 100 }], subtotal: 100, discount: 0, total: 100, validUntil: new Date(Date.now() + 86_400_000), version: 1, status: "PENDING" });
    await Booking.updateOne({ _id: bookingB }, { status: "AWAITING_APPROVAL" });
    await expect(respondToQuotation(customerB, quotation.id, { approve: true, total: 1 })).rejects.toMatchObject({ name: "ZodError" });
    expect((await Quotation.findById(quotation.id))!.total).toBe(100);
    expect((await Quotation.findById(quotation.id))!.status).toBe("PENDING");
  });

  it("prevents editing a completed booking", async () => {
    await Booking.updateOne({ _id: bookingB }, { status: "COMPLETED" });
    await RepairReport.create({ bookingId: bookingB, technicianId: technicianB, diagnosisId: new mongoose.Types.ObjectId(), workPerformed: ["Done"], partsUsed: [], testResults: ["Passed"], finalNotes: "Repair completed", warrantyDays: 0, completedAt: new Date() });
    await expect(saveRepairTracking(bookingB, technicianB, { workPerformed: ["Changed"], partsUsed: [], testResults: ["Passed"], finalNotes: "Attempted edit", warrantyDays: 0 })).rejects.toMatchObject({ statusCode: 422 });
  });

  it("rejects booking an inactive service", async () => {
    const device = await Device.create({ ownerId: customerA, type: "DESKTOP", brand: "HP", model: "EliteDesk", serialNumber: "SECURITY-A" });
    await expect(createBooking(customerA, { deviceId: device.id, serviceIds: [inactiveService], problemTitle: "Inactive service", problemDescription: "Attempting to book a service that is no longer offered.", symptoms: [], imageUrls: [], serviceMethod: "WALK_IN", preferredDate: new Date(Date.now() + 86_400_000), preferredTimeSlot: "11:00-13:00" })).rejects.toMatchObject({ statusCode: 422 });
  });

  it("rejects approval of an expired quotation", async () => {
    await Booking.updateOne({ _id: bookingB }, { status: "AWAITING_APPROVAL" });
    const quotation = await Quotation.create({ bookingId: bookingB, diagnosisId: new mongoose.Types.ObjectId(), createdBy: technicianB, items: [{ description: "Labour", type: "LABOUR", quantity: 1, unitPrice: 75, amount: 75 }], subtotal: 75, discount: 0, total: 75, validUntil: new Date(Date.now() - 1_000), version: 2, status: "PENDING" });
    await expect(respondToQuotation(customerB, quotation.id, { approve: true })).rejects.toMatchObject({ statusCode: 422 });
    expect((await Quotation.findById(quotation.id))!.status).toBe("PENDING");
  });
});
