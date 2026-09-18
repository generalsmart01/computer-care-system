import { describe, expect, it } from "vitest";
import { CARE_SERVICES } from "@/lib/care-service-catalog";
import { DEVICE_TYPES, SERVICE_CATEGORIES } from "@/lib/constants";

describe("care service catalog", () => {
  it("covers computers, tablets, and phones with unique slugs", () => {
    expect(new Set(CARE_SERVICES.map(service => service.slug)).size).toBe(CARE_SERVICES.length);
    for (const type of ["LAPTOP", "DESKTOP", "TABLET", "PHONE"])
      expect(CARE_SERVICES.filter(service => service.supportedDeviceTypes.includes(type as typeof DEVICE_TYPES[number])).length).toBeGreaterThanOrEqual(5);
  });

  it("uses valid categories, device types, and naira starting estimates", () => {
    for (const service of CARE_SERVICES) {
      expect(SERVICE_CATEGORIES).toContain(service.category);
      expect(service.supportedDeviceTypes.length).toBeGreaterThan(0);
      for (const type of service.supportedDeviceTypes) expect(DEVICE_TYPES).toContain(type);
      expect(service.basePrice).toBeGreaterThanOrEqual(10_000);
      expect(service.requiresQuotationApproval).toBe(true);
    }
  });
});
