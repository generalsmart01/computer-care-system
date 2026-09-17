import { describe, expect, it } from "vitest";
import { adminBookingQuerySchema, buildAdminBookingFilter, escapeSearch } from "@/features/bookings/admin-list.validation";
import { canAdminTransition } from "@/features/bookings/admin-transitions";

describe("admin booking filters", () => {
  it("escapes regular-expression control characters", () => {
    expect(escapeSearch("CMB-(test)+")).toBe("CMB-\\(test\\)\\+");
  });

  it("builds service, status, date and safe search filters", () => {
    const query = adminBookingQuerySchema.parse({ search: "CMB.*", status: "PENDING", serviceId: "a".repeat(24), dateFrom: "2026-08-01", dateTo: "2026-08-31" });
    expect(buildAdminBookingFilter(query)).toMatchObject({ status: "PENDING", serviceIds: "a".repeat(24), preferredDate: { $gte: expect.any(Date), $lte: expect.any(Date) }, $or: [{ reference: { $regex: "CMB\\.\\*", $options:"i" } },{ problemTitle:{ $regex:"CMB\\.\\*",$options:"i" } }] });
  });

  it("rejects reversed date ranges", () => {
    expect(adminBookingQuerySchema.safeParse({ dateFrom: "2026-09-01", dateTo: "2026-08-01" }).success).toBe(false);
  });
});

describe("admin intake transitions", () => {
  it("permits only roadmap admin intake actions", () => {
    expect(canAdminTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canAdminTransition("AWAITING_DEVICE", "RECEIVED")).toBe(true);
    expect(canAdminTransition("RECEIVED", "ASSIGNED")).toBe(false);
    expect(canAdminTransition("QUALITY_CHECK", "READY_FOR_COLLECTION")).toBe(false);
  });
});
