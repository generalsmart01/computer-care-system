import { describe, expect, it } from "vitest";
import { normalizeSlug, serviceInputSchema } from "@/features/services/service.validation";

const valid = {
  name: "Laptop Repair",
  slug: "",
  category: "HARDWARE_REPAIR",
  shortDescription: "Professional laptop repairs.",
  description: "Complete laptop diagnosis and repair service.",
  basePrice: "75000",
  estimatedDurationMinutes: "90",
  requiresDiagnosis: "on",
  requiresQuotationApproval: "on",
};

describe("service validation", () => {
  it("normalizes slugs", () => {
    expect(normalizeSlug("  Data Recovery & Repair! ")).toBe("data-recovery-repair");
  });

  it("generates a slug and coerces form values", () => {
    expect(serviceInputSchema.parse(valid)).toMatchObject({
      slug: "laptop-repair",
      basePrice: 75000,
      estimatedDurationMinutes: 90,
      requiresDiagnosis: true,
    });
  });

  it("rejects a negative price", () => {
    expect(serviceInputSchema.safeParse({ ...valid, basePrice: "-1" }).success).toBe(false);
    expect(serviceInputSchema.safeParse({ ...valid, basePrice: "9999" }).success).toBe(false);
  });

  it("rejects unknown categories", () => {
    expect(serviceInputSchema.safeParse({ ...valid, category: "UNKNOWN" }).success).toBe(false);
  });

  it("accepts only supported device types", () => {
    expect(serviceInputSchema.parse({ ...valid, supportedDeviceTypes: ["PHONE"] }).supportedDeviceTypes).toEqual(["PHONE"]);
    expect(serviceInputSchema.safeParse({ ...valid, supportedDeviceTypes: ["CAR"] }).success).toBe(false);
  });
});
