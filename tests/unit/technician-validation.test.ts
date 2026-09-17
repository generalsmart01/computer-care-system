import { describe, expect, it } from "vitest";
import {
  createTechnicianSchema,
  updateTechnicianSchema,
} from "@/features/technicians/technician.validation";

const valid = {
  firstName: "Ada",
  lastName: "Tech",
  email: "ADA@EXAMPLE.COM",
  phone: "",
  employeeNumber: "tech-001",
  specializations: "Diagnostics, Hardware Repair",
  yearsOfExperience: "4",
  availabilityStatus: "AVAILABLE",
  maximumActiveJobs: "5",
  bio: "Senior repair technician.",
};
describe("technician management validation", () => {
  it("normalizes account and profile input", () => {
    expect(createTechnicianSchema.parse(valid)).toMatchObject({
      email: "ada@example.com",
      employeeNumber: "TECH-001",
      specializations: ["Diagnostics", "Hardware Repair"],
      yearsOfExperience: 4,
      maximumActiveJobs: 5,
    });
  });
  it("does not require an administrator-supplied password", () => {
    expect(createTechnicianSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects an empty specialization list", () => {
    expect(
      createTechnicianSchema.safeParse({ ...valid, specializations: "" })
        .success,
    ).toBe(false);
  });
  it("allows only active or suspended management states", () => {
    const editable = {
      firstName: valid.firstName,
      lastName: valid.lastName,
      phone: valid.phone,
      employeeNumber: valid.employeeNumber,
      specializations: valid.specializations,
      yearsOfExperience: valid.yearsOfExperience,
      availabilityStatus: valid.availabilityStatus,
      maximumActiveJobs: valid.maximumActiveJobs,
      bio: valid.bio,
    };
    expect(
      updateTechnicianSchema.safeParse({ ...editable, status: "DEACTIVATED" })
        .success,
    ).toBe(false);
  });
});
