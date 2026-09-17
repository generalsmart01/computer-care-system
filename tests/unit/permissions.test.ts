import { describe, expect, it } from "vitest";
import { USER_ROLES, type UserRole } from "@/lib/constants";
import { canAccessRole, dashboardForRole } from "@/lib/role-navigation";

describe("role permissions", () => {
  it.each(USER_ROLES)("allows %s into its own protected area", (role) =>
    expect(canAccessRole(role, [role])).toBe(true),
  );
  it.each([
    { actual: "CUSTOMER", allowed: ["TECHNICIAN", "ADMIN"] },
    { actual: "TECHNICIAN", allowed: ["CUSTOMER", "ADMIN"] },
    { actual: "ADMIN", allowed: ["CUSTOMER", "TECHNICIAN", "SUPER_ADMIN"] },
  ] as Array<{ actual: UserRole; allowed: UserRole[] }>)(
    "denies $actual from other role areas",
    ({ actual, allowed }) => expect(canAccessRole(actual, allowed)).toBe(false),
  );
  it("lets super administrators inherit administrator access only", () => {
    expect(canAccessRole("SUPER_ADMIN", ["ADMIN"])).toBe(true);
    expect(canAccessRole("SUPER_ADMIN", ["TECHNICIAN"])).toBe(false);
    expect(canAccessRole("ADMIN", ["SUPER_ADMIN"])).toBe(false);
  });
  it("routes both administrator levels to the admin workspace", () => {
    expect(dashboardForRole("ADMIN")).toBe("/admin");
    expect(dashboardForRole("SUPER_ADMIN")).toBe("/admin");
  });
});
