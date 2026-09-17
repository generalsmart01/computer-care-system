import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { E2E_DATABASE, PASSWORD } from "./database";
import { User } from "../../models/User";
import { TechnicianProfile } from "../../models/TechnicianProfile";
import { Service } from "../../models/Service";
export default async function setup() {
  if (!/e2e-test$/.test(E2E_DATABASE))
    throw new Error("Unsafe E2E database name");
  await mongoose.connect(E2E_DATABASE);
  await mongoose.connection.db!.dropDatabase();
  const hash = await bcrypt.hash(PASSWORD, 4),
    users = await User.create([
      {
        firstName: "E2E",
        lastName: "Admin",
        email: "admin.e2e@example.test",
        passwordHash: hash,
        role: "ADMIN",
      },
      {
        firstName: "E2E",
        lastName: "Technician",
        email: "technician.e2e@example.test",
        passwordHash: hash,
        role: "TECHNICIAN",
      },
    ]),
    technician = users[1];
  await TechnicianProfile.create({
    userId: technician.id,
    employeeNumber: "E2E-TECH-001",
    specializations: ["Hardware diagnostics"],
    availabilityStatus: "AVAILABLE",
    maximumActiveJobs: 5,
  });
  await Service.create({
    name: "E2E hardware repair",
    slug: "e2e-hardware-repair",
    category: "HARDWARE_REPAIR",
    shortDescription: "A deterministic browser-test repair service.",
    description: "Used only by the isolated successful repair browser journey.",
    basePrice: 15000,
    requiresDiagnosis: true,
    requiresQuotationApproval: true,
    isActive: true,
  });
  await mongoose.disconnect();
}
