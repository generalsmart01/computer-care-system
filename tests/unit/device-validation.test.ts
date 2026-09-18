import { describe, expect, it } from "vitest";
import { deviceSchema } from "@/features/devices/device.validation";

describe("device validation", () => {
  it("trims required fields and removes empty optional values", () => {
    expect(deviceSchema.parse({ type: "LAPTOP", brand: "  Lenovo  ", model: " T14 ", serialNumber: "" }))
      .toEqual({ type: "LAPTOP", brand: "Lenovo", model: "T14", serialNumber: undefined });
  });

  it("accepts phones and rejects unsupported device types", () => {
    expect(deviceSchema.safeParse({ type: "PHONE", brand: "Apple", model: "15" }).success).toBe(true);
    expect(deviceSchema.safeParse({ type: "CAR", brand: "Toyota", model: "Camry" }).success).toBe(false);
  });

  it("rejects oversized notes", () => {
    expect(deviceSchema.safeParse({ type: "OTHER", brand: "Custom", model: "PC", notes: "x".repeat(1001) }).success).toBe(false);
  });
});
