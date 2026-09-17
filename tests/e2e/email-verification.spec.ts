import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { expect, test } from "@playwright/test";
import { EmailVerificationToken } from "../../models/EmailVerificationToken";
import { User } from "../../models/User";
import { E2E_DATABASE, PASSWORD } from "./database";

test("customer verifies email before accessing the dashboard", async ({
  page,
}) => {
  const email = "verified-customer.e2e@example.test";
  await page.goto("/register");
  await page.getByLabel("First name").fill("Aisha");
  await page.getByLabel("Last name").fill("Bello");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify-email\?sent=1/);

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(
    page.getByText("Verify your email address before signing in", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  const token = "focused-e2e-verification-token";
  await mongoose.connect(E2E_DATABASE);
  const customer: any = await User.findOne({ email }).lean();
  await EmailVerificationToken.create({
    userId: customer._id,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    purpose: "CUSTOMER_EMAIL_VERIFICATION",
    expiresAt: new Date(Date.now() + 60_000),
  });
  await mongoose.disconnect();

  await page.goto(`/verify-email?token=${token}`);
  await expect(
    page.getByRole("heading", { name: "Your account is ready" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Continue to login" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
