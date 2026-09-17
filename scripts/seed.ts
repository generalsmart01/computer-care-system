import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { loadEnvConfig } from "@next/env";
import { Assignment } from "../models/Assignment";
import { Booking } from "../models/Booking";
import { BookingStatusHistory } from "../models/BookingStatusHistory";
import { Device } from "../models/Device";
import { Service } from "../models/Service";
import { TechnicianProfile } from "../models/TechnicianProfile";
import { User } from "../models/User";
import {
  ACTIVE_DEMO_STATUSES,
  DEMO_SERVICES,
  DEMO_USERS,
  PRIMARY_DEMO_ACCOUNTS,
  TERMINAL_DEMO_STATUSES,
  demoDeviceSpecs,
  validateDemoPassword,
} from "../lib/demo-seed";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri)
    throw new Error(
      "MONGODB_URI is required. Add it to .env.local or pass it to the command.",
    );
  await mongoose.connect(uri);
  try {
    const serviceDocuments = [];
    for (const [name, slug, category, basePrice] of DEMO_SERVICES) {
      serviceDocuments.push(
        await Service.findOneAndUpdate(
          { slug },
          {
            $set: {
              name,
              slug,
              category,
              basePrice,
              shortDescription: `Professional ${name.toLowerCase()} for homes and businesses across Nigeria.`,
              description: `Reliable ${name.toLowerCase()} with clear diagnosis, transparent naira pricing, and progress tracking from booking to handover.`,
              requiresDiagnosis: true,
              requiresQuotationApproval: true,
              isActive: true,
            },
          },
          { upsert: true, new: true },
        ),
      );
    }
    const configuredPassword = process.env.DEMO_PASSWORD;
    if (!configuredPassword) {
      console.log(
        "Service seed complete. Set DEMO_PASSWORD to create the complete demo dataset.",
      );
      return;
    }
    const demoPassword = validateDemoPassword(configuredPassword);
    const passwordHash = await bcrypt.hash(demoPassword, 12),
      users = new Map<string, any>();
    for (const spec of DEMO_USERS) {
      const { legacyEmail, ...account } = spec;
      const user = await User.findOneAndUpdate(
        { email: { $in: [spec.email, legacyEmail] } },
        {
          $set: {
            ...account,
            passwordHash,
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
            mustChangePassword: false,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      users.set(spec.email, user);
      if (spec.role === "TECHNICIAN") {
        const technicianNumber =
          DEMO_USERS.filter(
            (account) => account.role === "TECHNICIAN",
          ).findIndex((account) => account.email === spec.email) + 1;
        await TechnicianProfile.updateOne(
          { userId: user.id },
          {
            $setOnInsert: {
              userId: user.id,
              employeeNumber: `TECH-${String(technicianNumber).padStart(3, "0")}`,
              specializations: ["Diagnostics", "Hardware repair"],
              availabilityStatus: "AVAILABLE",
              activeJobCount: 0,
              maximumActiveJobs: 5,
            },
          },
          { upsert: true },
        );
      }
    }
    const devices = [];
    for (const spec of demoDeviceSpecs()) {
      const owner = users.get(spec.ownerEmail);
      const legacySerial = spec.serialNumber.replace("NG-CMB-", "DEMO-");
      devices.push(
        await Device.findOneAndUpdate(
          { serialNumber: { $in: [spec.serialNumber, legacySerial] } },
          {
            $set: {
              ownerId: owner.id,
              type: spec.type,
              brand: spec.brand,
              model: spec.model,
              serialNumber: spec.serialNumber,
              operatingSystem:
                spec.type === "LAPTOP" ? "Windows 11" : "Ubuntu 24.04",
              isActive: true,
            },
          },
          { upsert: true, new: true },
        ),
      );
    }
    const customers = DEMO_USERS.filter((spec) => spec.role === "CUSTOMER").map(
        (spec) => users.get(spec.email),
      ),
      technicians = DEMO_USERS.filter((spec) => spec.role === "TECHNICIAN").map(
        (spec) => users.get(spec.email),
      ),
      admin = users.get(PRIMARY_DEMO_ACCOUNTS.ADMIN);
    const statuses = [...ACTIVE_DEMO_STATUSES, ...TERMINAL_DEMO_STATUSES],
      bookings = [];
    for (let index = 0; index < 20; index++) {
      const deviceIndex = index < 10 ? index : index - 10,
        customerIndex = Math.floor(deviceIndex / 2),
        customer = customers[customerIndex],
        device = devices[deviceIndex],
        service = serviceDocuments[index % serviceDocuments.length],
        status = statuses[index];
      const reference = `CMB-2099-${String(index + 1).padStart(6, "0")}`;
      const booking = await Booking.findOneAndUpdate(
        { reference },
        {
          $set: {
            customerId: customer.id,
            deviceId: device.id,
            serviceIds: [service.id],
            problemTitle: `${service.name} request for ${device.brand} ${device.model}`,
            problemDescription: `The customer reported an intermittent fault and reduced performance while using this device. A full assessment is required before repairs begin.`,
            symptoms: ["Intermittent fault", "Reduced performance"],
            imageUrls: [],
            serviceMethod: "WALK_IN",
            preferredDate: new Date(Date.now() + (index + 1) * 86_400_000),
            preferredTimeSlot: index % 2 ? "11:00-13:00" : "09:00-11:00",
            basePriceSnapshot: service.basePrice,
            status,
          },
          $setOnInsert: { reference },
        },
        { upsert: true, new: true },
      );
      bookings.push(booking);
      await BookingStatusHistory.updateOne(
        { bookingId: booking.id, toStatus: status },
        {
          $set: { changedBy: admin.id, note: "Workflow status recorded" },
          $setOnInsert: { bookingId: booking.id, toStatus: status },
        },
        { upsert: true },
      );
    }
    const assignedStatuses = new Set([
      "ASSIGNED",
      "DIAGNOSING",
      "AWAITING_APPROVAL",
      "APPROVED",
      "REPAIRING",
      "QUALITY_CHECK",
      "READY_FOR_COLLECTION",
      "COMPLETED",
    ]);
    for (const [index, booking] of bookings.entries())
      if (assignedStatuses.has(booking.status)) {
        const technician = technicians[index % technicians.length],
          completed = booking.status === "COMPLETED";
        await Assignment.updateOne(
          { bookingId: booking.id },
          {
            $setOnInsert: {
              bookingId: booking.id,
              technicianId: technician.id,
              assignedBy: admin.id,
              acceptedAt: new Date(),
              status: completed ? "COMPLETED" : "ACTIVE",
              ...(completed ? { endedAt: new Date() } : {}),
            },
          },
          { upsert: true },
        );
      }
    for (const technician of technicians)
      await TechnicianProfile.updateOne(
        { userId: technician.id },
        {
          $set: {
            activeJobCount: await Assignment.countDocuments({
              technicianId: technician.id,
              status: "ACTIVE",
            }),
          },
        },
      );
    console.log(
      "Seed complete: 8 services, 1 admin, 3 technicians, 5 customers, 10 devices, and 20 bookings.",
    );
    console.log(
      `Demo logins — admin: ${PRIMARY_DEMO_ACCOUNTS.ADMIN}; technician: ${PRIMARY_DEMO_ACCOUNTS.TECHNICIAN}; customer: ${PRIMARY_DEMO_ACCOUNTS.CUSTOMER}. Use the runtime DEMO_PASSWORD.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
