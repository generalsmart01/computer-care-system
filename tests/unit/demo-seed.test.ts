import { describe, expect, it } from "vitest";
import {
  ACTIVE_DEMO_STATUSES,
  DEMO_SERVICES,
  DEMO_USERS,
  PRIMARY_DEMO_ACCOUNTS,
  TERMINAL_DEMO_STATUSES,
  demoDeviceSpecs,
  validateDemoPassword,
} from "@/lib/demo-seed";

describe("Phase 63 demo seed manifest", () => {
  it("defines the required users and services", () => {
    expect(DEMO_SERVICES).toHaveLength(8);
    expect(DEMO_SERVICES.every(([, , , price]) => price >= 10_000)).toBe(true);
    expect(DEMO_USERS.filter((user) => user.role === "ADMIN")).toHaveLength(1);
    expect(
      DEMO_USERS.filter((user) => user.role === "TECHNICIAN"),
    ).toHaveLength(3);
    expect(DEMO_USERS.filter((user) => user.role === "CUSTOMER")).toHaveLength(
      5,
    );
    expect(DEMO_USERS).toEqual(
      expect.arrayContaining(
        Object.entries(PRIMARY_DEMO_ACCOUNTS).map(([role, email]) =>
          expect.objectContaining({ role, email }),
        ),
      ),
    );
  });

  it("requires a strong runtime demo password", () => {
    expect(() => validateDemoPassword("weakpass")).toThrow(/DEMO_PASSWORD/);
    expect(validateDemoPassword("StrongDemo123")).toBe("StrongDemo123");
  });

  it("defines exactly two uniquely identified devices per customer", () => {
    const devices = demoDeviceSpecs();
    expect(devices).toHaveLength(10);
    expect(new Set(devices.map((device) => device.serialNumber)).size).toBe(10);
    for (const customer of DEMO_USERS.filter(
      (user) => user.role === "CUSTOMER",
    ))
      expect(
        devices.filter((device) => device.ownerEmail === customer.email),
      ).toHaveLength(2);
  });

  it("defines twenty bookings across varied active and terminal states", () => {
    const statuses = [...ACTIVE_DEMO_STATUSES, ...TERMINAL_DEMO_STATUSES];
    expect(statuses).toHaveLength(20);
    expect(new Set(statuses).size).toBeGreaterThanOrEqual(10);
    expect(statuses).toContain("PENDING");
    expect(statuses).toContain("REPAIRING");
    expect(statuses).toContain("COMPLETED");
    expect(statuses).toContain("CANCELLED");
  });
});
