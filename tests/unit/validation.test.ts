import { describe, it, expect } from "vitest";
import { emailSchema, passwordSchema, objectIdSchema } from "@/lib/validators";
import { formatBookingReference } from "@/features/bookings/reference-format";
import { reviewSchema } from "@/features/reviews/review.validation";
import { changePasswordSchema } from "@/features/auth/auth.validation";
describe("shared validation", () => {
  it("normalizes email", () =>
    expect(emailSchema.parse(" Test@Example.COM ")).toBe("test@example.com"));
  it("enforces password complexity", () =>
    expect(() => passwordSchema.parse("password")).toThrow());
  it("validates object ids", () =>
    expect(objectIdSchema.safeParse("bad").success).toBe(false));
  it("formats references", () =>
    expect(formatBookingReference(2026, 12)).toBe("CMB-2026-000012"));
  it("requires review ratings from 1 to 5", () =>
    expect(
      reviewSchema.safeParse({ bookingId: "a".repeat(24), rating: 6 }).success,
    ).toBe(false));
  it("requires a new confirmed password", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "OldPass123",
        newPassword: "NewPass123",
        confirmPassword: "NewPass123",
      }).success,
    ).toBe(true);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "OldPass123",
        newPassword: "OldPass123",
        confirmPassword: "OldPass123",
      }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "OldPass123",
        newPassword: "NewPass123",
        confirmPassword: "Mismatch123",
      }).success,
    ).toBe(false);
  });
});
