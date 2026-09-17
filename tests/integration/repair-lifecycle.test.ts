import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth", () => ({
  createSession: vi.fn(),
  destroySession: vi.fn(),
}));
vi.mock("@/features/email/email.service", () => ({
  sendLifecycleEmail: vi.fn().mockResolvedValue({ sent: true }),
  sendVerificationEmail: vi.fn().mockResolvedValue({ sent: true }),
}));
import { requestDiagnosisRevision } from "@/features/diagnoses/diagnosis.service";
import { Diagnosis } from "@/models/Diagnosis";
import { createHash } from "node:crypto";
import { EmailVerificationToken } from "@/models/EmailVerificationToken";
import {
  completeTechnicianInvitation,
  verifyEmailToken,
} from "@/features/auth/email-verification.service";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { register, login, changePassword } from "@/features/auth/auth.service";
import { createDevice } from "@/features/devices/device.service";
import { createBooking } from "@/features/bookings/booking.service";
import { transitionBooking } from "@/features/bookings/status.service";
import {
  assignTechnician,
  acceptAssignment,
} from "@/features/assignments/assignment.service";
import {
  startDiagnosis,
  submitDiagnosis,
} from "@/features/diagnoses/diagnosis.service";
import { buildQuotation } from "@/features/quotations/quotation-builder.service";
import { respondToQuotation } from "@/features/quotations/response.service";
import { startRepair } from "@/features/repairs/start-repair.service";
import { saveRepairTracking } from "@/features/repairs/repair-tracking.service";
import { submitRepairReport } from "@/features/repairs/repair-submission.service";
import { qualityCheck } from "@/features/repairs/quality-check.service";
import { completeHandover } from "@/features/repairs/handover.service";
import { createReview } from "@/features/reviews/review.service";
import { User } from "@/models/User";
import { Service } from "@/models/Service";
import { TechnicianProfile } from "@/models/TechnicianProfile";
import { Booking } from "@/models/Booking";
import { Assignment } from "@/models/Assignment";
import { Notification } from "@/models/Notification";
import { Review } from "@/models/Review";
let customerId = "",
  adminId = "",
  technicianId = "",
  deviceId = "",
  serviceId = "",
  bookingId = "",
  diagnosisId = "",
  quotationId = "";
describe.sequential("database-backed repair lifecycle", () => {
  beforeAll(async () => {
    await connectDB();
    await mongoose.connection.db!.dropDatabase();
    const hash = await bcrypt.hash("ValidPass123", 4),
      [admin, technician] = await User.create([
        {
          firstName: "Ada",
          lastName: "Admin",
          email: "admin.integration@example.test",
          passwordHash: hash,
          role: "ADMIN",
        },
        {
          firstName: "Terry",
          lastName: "Technician",
          email: "tech.integration@example.test",
          passwordHash: hash,
          role: "TECHNICIAN",
        },
      ]);
    adminId = admin.id;
    technicianId = technician.id;
    await TechnicianProfile.create({
      userId: technicianId,
      employeeNumber: "INT-TECH-001",
      specializations: ["Diagnostics"],
      availabilityStatus: "AVAILABLE",
      maximumActiveJobs: 3,
    });
    const service = await Service.create({
      name: "Integration repair",
      slug: "integration-repair",
      category: "HARDWARE_REPAIR",
      shortDescription: "Database-backed integration repair service.",
      description:
        "Exercises the complete repair lifecycle against isolated MongoDB.",
      basePrice: 75,
      requiresDiagnosis: true,
      requiresQuotationApproval: true,
    });
    serviceId = service.id;
  });
  afterAll(async () => {
    if (mongoose.connection.readyState) {
      await mongoose.connection.db!.dropDatabase();
      await mongoose.disconnect();
    }
  });
  it("registers, verifies email, and logs in a customer", async () => {
    const email = "customer.integration@example.test",
      registered = await register({
        firstName: "Casey",
        lastName: "Customer",
        email,
        phone: "+1 555 010 2000",
        password: "ValidPass123",
      });
    customerId = registered.id;
    await expect(login({ email, password: "ValidPass123" })).rejects.toThrow(
      /verify/i,
    );
    const token = "integration-verification-token";
    await EmailVerificationToken.create({
      userId: customerId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      purpose: "CUSTOMER_EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await verifyEmailToken(token);
    await expect(
      login({ email, password: "ValidPass123" }),
    ).resolves.toMatchObject({ role: "CUSTOMER" });
    expect(
      await User.exists({
        _id: customerId,
        status: "ACTIVE",
        emailVerifiedAt: { $type: "date" },
      }),
    ).toBeTruthy();
  });
  it("creates an owned device and booking with notification", async () => {
    const device = await createDevice(customerId, {
      type: "LAPTOP",
      brand: "Lenovo",
      model: "ThinkPad T14",
      serialNumber: "INT-SERIAL-001",
    });
    deviceId = device.id;
    const booking = await createBooking(customerId, {
      deviceId,
      serviceIds: [serviceId],
      problemTitle: "Laptop does not start",
      problemDescription:
        "The power light flashes but the laptop does not boot.",
      symptoms: ["No boot"],
      imageUrls: [],
      serviceMethod: "WALK_IN",
      preferredDate: new Date(Date.now() + 86_400_000),
      preferredTimeSlot: "09:00-11:00",
    });
    bookingId = booking.id;
    expect(booking.reference).toMatch(/^CMB-\d{4}-\d{6}$/);
    expect(booking.basePriceSnapshot).toBe(75);
    expect(
      await Notification.exists({
        userId: customerId,
        bookingId,
        type: "BOOKING_CREATED",
      }),
    ).toBeTruthy();
  });
  it("confirms, receives, assigns, and accepts the booking", async () => {
    await transitionBooking(
      bookingId,
      "CONFIRMED",
      adminId,
      "Appointment confirmed",
    );
    await transitionBooking(
      bookingId,
      "AWAITING_DEVICE",
      adminId,
      "Awaiting walk-in device",
    );
    await transitionBooking(bookingId, "RECEIVED", adminId, "Device received");
    await assignTechnician(bookingId, technicianId, adminId);
    await acceptAssignment(bookingId, technicianId);
    expect((await Booking.findById(bookingId))?.status).toBe("ASSIGNED");
    expect(
      await Assignment.exists({
        bookingId,
        technicianId,
        status: "ACTIVE",
        acceptedAt: { $exists: true },
      }),
    ).toBeTruthy();
  });
  it("preserves a submitted diagnosis and obtains approval from its revision", async () => {
    await startDiagnosis(bookingId, technicianId);
    const first = await submitDiagnosis(bookingId, technicianId, {
      observedSymptoms: ["No boot"],
      faultCategory: "POWER",
      faultDescription: "Suspected internal power controller failure",
      recommendedAction: "Recheck controller and verify charging",
      requiredParts: [
        { name: "Power controller", quantity: 1, estimatedUnitPrice: 40 },
      ],
      internalNotes: "Initial bench reading",
      customerSummary: "The power system needs further verification.",
    });
    const draft = await requestDiagnosisRevision(bookingId, adminId, {
      reason: "Confirm the controller fault before quoting",
    });
    expect(draft.revision).toBe(2);
    expect((await Diagnosis.findById(first.id))?.status).toBe("SUBMITTED");
    const diagnosis = await submitDiagnosis(bookingId, technicianId, {
      observedSymptoms: ["No boot"],
      faultCategory: "POWER",
      faultDescription: "Failed internal power controller",
      recommendedAction: "Replace controller and verify charging",
      requiredParts: [
        { name: "Power controller", quantity: 1, estimatedUnitPrice: 40 },
      ],
      internalNotes: "Bench supply confirmed the fault",
      customerSummary: "The internal power controller has failed.",
    });
    diagnosisId = diagnosis.id;
    expect(diagnosis.revision).toBe(2);
    expect(await Diagnosis.countDocuments({ bookingId })).toBe(2);
    const quotation = await buildQuotation(
      { id: technicianId, role: "TECHNICIAN" },
      bookingId,
      {
        diagnosisId,
        validUntil: new Date(Date.now() + 7 * 86_400_000),
        items: [
          {
            description: "Controller replacement labour",
            type: "LABOUR",
            quantity: 1,
            unitPrice: 60,
          },
          {
            description: "Power controller",
            type: "PART",
            quantity: 1,
            unitPrice: 40,
          },
        ],
        discount: 0,
      },
    );
    quotationId = quotation.id;
    await respondToQuotation(customerId, quotationId, {
      approve: true,
      note: "Approved",
    });
    expect((await Booking.findById(bookingId))?.status).toBe("APPROVED");
  });
  it("repairs, quality checks, and completes handover", async () => {
    await startRepair(bookingId, technicianId);
    await saveRepairTracking(bookingId, technicianId, {
      workPerformed: ["Replaced failed power controller"],
      partsUsed: [{ name: "Power controller", quantity: 1 }],
      testResults: ["Cold boot passed", "Charging passed"],
      finalNotes: "Device boots and charges normally after repeated testing.",
      warrantyDays: 90,
    });
    await submitRepairReport(bookingId, technicianId);
    await qualityCheck(bookingId, adminId, {
      decision: "PASS",
      deviceCondition: "GOOD",
      note: "All tests verified",
    });
    await completeHandover(bookingId, adminId, {
      finalAmount: 100,
      recipientName: "Casey Customer",
      handoverConfirmed: "on",
    });
    expect((await Booking.findById(bookingId))?.status).toBe("COMPLETED");
    expect(
      await Assignment.exists({ bookingId, status: "COMPLETED" }),
    ).toBeTruthy();
  });
  it("persists notifications and one completed-booking review", async () => {
    const review = await createReview(customerId, {
      bookingId,
      rating: 5,
      comment: "Clear and reliable repair workflow.",
    });
    expect(review.rating).toBe(5);
    expect(await Review.countDocuments({ bookingId, customerId })).toBe(1);
    const types = await Notification.distinct("type", {
      bookingId,
      userId: customerId,
    });
    expect(types).toEqual(
      expect.arrayContaining([
        "BOOKING_CREATED",
        "ASSIGNED",
        "DIAGNOSIS_READY",
        "QUOTATION_READY",
        "REPAIR_STARTED",
        "READY_FOR_COLLECTION",
        "BOOKING_COMPLETED",
      ]),
    );
  });

  it("changes the customer password only after checking the current password", async () => {
    await expect(
      changePassword(customerId, {
        currentPassword: "WrongPass123",
        newPassword: "UpdatedPass123",
        confirmPassword: "UpdatedPass123",
      }),
    ).rejects.toThrow(/incorrect/i);
    await changePassword(customerId, {
      currentPassword: "ValidPass123",
      newPassword: "UpdatedPass123",
      confirmPassword: "UpdatedPass123",
    });
    await expect(
      login({
        email: "customer.integration@example.test",
        password: "ValidPass123",
      }),
    ).rejects.toThrow();
    await expect(
      login({
        email: "customer.integration@example.test",
        password: "UpdatedPass123",
      }),
    ).resolves.toMatchObject({ role: "CUSTOMER" });
  });

  it("lets an invited technician verify email and create a password", async () => {
    const token = "integration-technician-invitation";
    await User.updateOne(
      { _id: technicianId },
      { $set: { mustChangePassword: true }, $unset: { emailVerifiedAt: 1 } },
    );
    await EmailVerificationToken.create({
      userId: technicianId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      purpose: "TECHNICIAN_INVITATION",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await expect(
      login({
        email: "tech.integration@example.test",
        password: "ValidPass123",
      }),
    ).rejects.toThrow(/invitation/i);
    await completeTechnicianInvitation({
      token,
      newPassword: "TechnicianPass456",
      confirmPassword: "TechnicianPass456",
    });
    await expect(
      login({
        email: "tech.integration@example.test",
        password: "ValidPass123",
      }),
    ).rejects.toThrow();
    await expect(
      login({
        email: "tech.integration@example.test",
        password: "TechnicianPass456",
      }),
    ).resolves.toMatchObject({ role: "TECHNICIAN" });
    expect(
      await User.exists({
        _id: technicianId,
        emailVerifiedAt: { $exists: true },
        mustChangePassword: false,
      }),
    ).toBeTruthy();
  });
});
