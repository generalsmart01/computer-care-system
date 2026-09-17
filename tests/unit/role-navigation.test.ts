import { describe, expect, it } from "vitest";
import { canAccessRole, dashboardForRole } from "@/lib/role-navigation";

describe("role navigation", () => {
  it("maps each role to its correct dashboard", () => {
    expect(dashboardForRole("CUSTOMER")).toBe("/dashboard");
    expect(dashboardForRole("TECHNICIAN")).toBe("/technician");
    expect(dashboardForRole("ADMIN")).toBe("/admin");
    expect(dashboardForRole("SUPER_ADMIN")).toBe("/admin");
  });
  it("enforces the administrator hierarchy", () => {
    expect(canAccessRole("ADMIN", ["ADMIN"])).toBe(true);
    expect(canAccessRole("SUPER_ADMIN", ["ADMIN"])).toBe(true);
    expect(canAccessRole("CUSTOMER", ["ADMIN"])).toBe(false);
  });
});
