import { describe, expect, it } from "vitest";
import { resolveEmailConfig } from "@/features/email/email.config";
import {
  lifecycleEmail,
  technicianInvitationEmail,
  verificationEmail,
} from "@/features/email/email.templates";
const base = {
  APP_URL: "https://computer-care.example/",
  EMAIL_HOST: "smtp.example.com",
  EMAIL_PORT: 587,
  EMAIL_USER: "mailer",
  EMAIL_PASSWORD: "secret",
  EMAIL_FROM: "ComputerCare <support@example.com>",
};
describe("required email notifications", () => {
  it("builds authenticated SMTP configuration", () => {
    expect(resolveEmailConfig(base)).toMatchObject({
      secure: false,
      port: 587,
      appUrl: "https://computer-care.example",
      auth: { user: "mailer", pass: "secret" },
    });
  });
  it("uses implicit TLS on port 465", () => {
    expect(resolveEmailConfig({ ...base, EMAIL_PORT: 465 })).toMatchObject({
      secure: true,
      port: 465,
    });
  });
  it("creates escaped plain-text and HTML lifecycle messages", () => {
    const message = lifecycleEmail(
      "QUOTATION_READY",
      "CMB-2026-000001",
      "https://example.com/dashboard/bookings/id",
      "Total < $125.00.",
    );
    expect(message.subject).toContain("Quotation ready");
    expect(message.text).toContain("Total < $125.00");
    expect(message.html).toContain("Total &lt; $125.00");
    expect(message.html).toContain("View your booking");
  });
  it("creates a time-limited verification message with an escaped link", () => {
    const message = verificationEmail(
      "Aisha <Bello>",
      "https://example.com/verify-email?token=a&b",
    );
    expect(message.subject).toContain("Verify");
    expect(message.text).toContain("expires in 30 minutes");
    expect(message.html).toContain("Aisha &lt;Bello&gt;");
    expect(message.html).toContain("token=a&amp;b");
  });
  it("creates a single-use technician setup invitation without a temporary password", () => {
    const message = technicianInvitationEmail(
      "Chidi <Okafor>",
      "https://example.com/onboarding/technician?token=a&b",
    );
    expect(message.subject).toContain("technician account");
    expect(message.text).toContain("single-use link expires in 30 minutes");
    expect(message.text).not.toContain("temporary password");
    expect(message.html).toContain("Chidi &lt;Okafor&gt;");
    expect(message.html).toContain("token=a&amp;b");
  });
});
