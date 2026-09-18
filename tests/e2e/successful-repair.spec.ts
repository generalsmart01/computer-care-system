import { expect, test, type Browser, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { EmailVerificationToken } from "../../models/EmailVerificationToken";
import { User } from "../../models/User";
import { E2E_DATABASE, PASSWORD as LOCAL_PASSWORD } from "./database";
const PASSWORD = process.env.SMOKE_PASSWORD || LOCAL_PASSWORD,
  ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || "admin.e2e@example.test",
  TECHNICIAN_EMAIL =
    process.env.SMOKE_TECHNICIAN_EMAIL || "technician.e2e@example.test",
  SERVICE_NAME = process.env.SMOKE_SERVICE_NAME || "E2E hardware repair",
  RUN_ID = (process.env.SMOKE_RUN_ID || "e2e")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .slice(0, 40),
  CUSTOMER_EMAIL =
    RUN_ID === "e2e"
      ? "customer.e2e@example.test"
      : `smoke.${RUN_ID}@example.test`,
  SERIAL = RUN_ID === "e2e" ? "E2E-SERIAL-001" : `SMOKE-${RUN_ID}`;
const CAPTURE = process.env.CAPTURE_DOCUMENTATION === "1";
async function capture(page: Page, name: string) {
  if (CAPTURE) {
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".skeleton")).toHaveCount(0);
    await page.screenshot({
      path: `docs/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}
async function login(browser: Browser, email: string, path: string) {
  const context = await browser.newContext(),
    page = await context.newPage();
  await page.goto(path === "/admin" ? "/login/admin" : path === "/technician" ? "/login/technician" : "/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  return { context, page };
}
async function reloadUntil(page: Page, text: string) {
  await page.waitForTimeout(750);
  await expect
    .poll(async () => {
      await page.reload();
      return page.locator(".status").first().textContent();
    })
    .toBe(text);
}
test("customer repair succeeds from registration through review", async ({
  browser,
}) => {
  const customer = await browser.newContext(),
    page = await customer.newPage();
  await page.goto("/");
  await capture(page, "01-homepage");
  await page.goto("/register");
  await capture(page, "02-register");
  await page.goto("/login");
  await capture(page, "03-login");
  await page.goto("/register");
  await page.getByLabel("First name").fill("E2E");
  await page.getByLabel("Last name").fill("Customer");
  await page.getByLabel("Email").fill(CUSTOMER_EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify-email\?sent=1/);
  const verificationToken = "e2e-customer-email-verification";
  await mongoose.connect(E2E_DATABASE);
  const registeredCustomer: any = await User.findOne({
    email: CUSTOMER_EMAIL,
  }).lean();
  await EmailVerificationToken.create({
    userId: registeredCustomer!._id,
    tokenHash: createHash("sha256").update(verificationToken).digest("hex"),
    purpose: "CUSTOMER_EMAIL_VERIFICATION",
    expiresAt: new Date(Date.now() + 60_000),
  });
  await mongoose.disconnect();
  await page.goto(`/verify-email?token=${verificationToken}`);
  await expect(
    page.getByRole("heading", { name: "Your account is ready" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Continue to login" }).click();
  await page.getByLabel("Email").fill(CUSTOMER_EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await capture(page, "04-customer-dashboard");
  await page.goto("/dashboard/devices/new");
  await page.getByLabel("Brand").fill("Lenovo");
  await page.getByLabel("Model").fill("ThinkPad E2E");
  await page.getByLabel("Serial number").fill(SERIAL);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Step 2 of 3")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Step 3 of 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save device" })).toBeVisible();
  await page.evaluate(() => {
    const form = document.querySelector<HTMLFormElement>("form.device-form");
    window.setTimeout(() => form?.requestSubmit(), 0);
  });
  await expect(page).toHaveURL(/\/dashboard\/devices$/);
  await expect(
    page.getByRole("heading", { name: /Lenovo ThinkPad E2E/ }),
  ).toBeVisible();
  await capture(page, "05-device-pages");
  await page.goto("/dashboard/bookings/new");
  await capture(page, "06-booking-form");
  await page.getByLabel("Device").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByText(new RegExp(SERVICE_NAME, "i")).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Problem title").fill("Laptop will not boot");
  await page
    .getByLabel("Description")
    .fill("The laptop power light flashes but the system never starts.");
  await page
    .getByLabel("Symptoms, comma-separated")
    .fill("No boot, flashing power light");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("Preferred date").fill(tomorrow);
  await page.getByLabel("Preferred time slot").fill("09:00-11:00");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Submit booking" }).click();
  await page.waitForTimeout(2_000);
  await page.goto("/dashboard/bookings");
  const persistedBooking = page.getByText("Laptop will not boot", {
    exact: true,
  });
  await expect(persistedBooking).toBeVisible();
  await persistedBooking.click();
  await expect(page).toHaveURL(/\/dashboard\/bookings\/[a-f0-9]{24}$/);
  await capture(page, "07-booking-details");
  const bookingUrl = new URL(page.url()).pathname,
    reference = (await page.getByRole("heading", { level: 1 }).textContent())!;
  const admin = await login(browser, ADMIN_EMAIL, "/admin");
  await capture(admin.page, "08-admin-dashboard");
  await admin.page.goto("/admin/bookings");
  await capture(admin.page, "09-admin-bookings");
  await admin.page.goto(bookingUrl.replace("/dashboard", "/admin"));
  await admin.page.getByRole("button", { name: "Confirm booking" }).click();
  await reloadUntil(admin.page, "CONFIRMED");
  await admin.page
    .getByRole("button", { name: "Mark awaiting device" })
    .click();
  await reloadUntil(admin.page, "AWAITING_DEVICE");
  await admin.page
    .getByRole("button", { name: "Mark device received" })
    .click();
  await reloadUntil(admin.page, "RECEIVED");
  await admin.page
    .getByLabel("Available technician")
    .selectOption({ index: 1 });
  await admin.page.getByRole("button", { name: "Assign technician" }).click();
  await reloadUntil(admin.page, "ASSIGNED");
  const technician = await login(browser, TECHNICIAN_EMAIL, "/technician");
  await capture(technician.page, "10-technician-dashboard");
  await technician.page.goto("/technician/jobs");
  await technician.page.getByText(new RegExp(reference)).click();
  await technician.page
    .getByRole("button", { name: "Accept assignment" })
    .click();
  await reloadUntil(technician.page, "ASSIGNED");
  await technician.page
    .getByRole("button", { name: "Start diagnosis" })
    .click();
  await reloadUntil(technician.page, "DIAGNOSING");
  await capture(technician.page, "11-diagnosis");
  await technician.page
    .getByLabel("Observed symptoms, comma-separated")
    .fill("No boot, flashing power light");
  await technician.page.getByLabel("Fault category").fill("POWER");
  await technician.page
    .getByLabel("Fault description")
    .fill("Failed internal power controller");
  await technician.page
    .getByLabel("Recommended action")
    .fill("Replace controller and verify charging");
  await technician.page
    .getByLabel("Required parts")
    .fill("Power controller | 1 | 40");
  await technician.page
    .getByLabel("Customer summary")
    .fill("The internal power controller failed.");
  await technician.page
    .getByLabel("Internal notes")
    .fill("Bench supply confirmed the failure.");
  await technician.page
    .getByRole("button", { name: "Submit diagnosis" })
    .click();
  await reloadUntil(technician.page, "AWAITING_APPROVAL");
  await admin.page.reload();
  await admin.page
    .getByLabel("Revision reason")
    .fill("Confirm the controller fault before quotation");
  await admin.page
    .getByRole("button", { name: "Request diagnosis revision" })
    .click();
  await reloadUntil(admin.page, "DIAGNOSING");
  await reloadUntil(technician.page, "DIAGNOSING");
  await expect(
    technician.page.getByRole("heading", {
      name: "Diagnosis worksheet — Revision 2",
    }),
  ).toBeVisible();
  await technician.page
    .getByLabel("Customer summary")
    .fill("Revision 2 confirms the internal power controller failed.");
  await technician.page
    .getByRole("button", { name: "Submit diagnosis" })
    .click();
  await reloadUntil(technician.page, "AWAITING_APPROVAL");
  await expect(
    technician.page.getByRole("heading", { name: "Revision 1 · SUBMITTED" }),
  ).toBeVisible();
  await expect(
    technician.page.getByRole("heading", { name: "Revision 2 · SUBMITTED" }),
  ).toBeVisible();
  await capture(technician.page, "12-quotation");
  await technician.page
    .getByLabel("Description")
    .last()
    .fill("Controller replacement labour");
  await technician.page.getByLabel("Quantity").fill("1");
  await technician.page.getByLabel("Unit price").fill("100");
  const valid = new Date(Date.now() + 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  await technician.page.getByLabel("Valid until").fill(valid);
  await technician.page.getByRole("button", { name: "Send quotation" }).click();
  await technician.page.waitForTimeout(1_000);
  await page.goto(bookingUrl);
  await page.getByRole("button", { name: "Approve quotation" }).click();
  await reloadUntil(technician.page, "APPROVED");
  await technician.page.getByRole("button", { name: "Start repair" }).click();
  await reloadUntil(technician.page, "REPAIRING");
  await capture(technician.page, "13-repair-tracking");
  await technician.page
    .getByLabel("Work performed")
    .fill("Replaced failed power controller");
  await technician.page
    .getByLabel("Parts replaced")
    .fill("Power controller | 1");
  await technician.page
    .getByLabel("Tests performed and results")
    .fill("Cold boot passed\nCharging passed");
  await technician.page
    .getByLabel("Repair notes")
    .fill("Device boots and charges normally after repeated testing.");
  await technician.page.getByLabel("Warranty days").fill("90");
  await technician.page
    .getByRole("button", { name: "Save repair progress" })
    .click();
  await technician.page.waitForTimeout(1_000);
  await technician.page
    .getByRole("button", { name: "Submit repair report" })
    .click();
  await reloadUntil(technician.page, "QUALITY_CHECK");
  await admin.page.reload();
  await admin.page
    .getByLabel("Device condition after repair")
    .selectOption("GOOD");
  await admin.page.getByLabel("Decision").selectOption("PASS");
  await admin.page.getByLabel("Review note").fill("All tests verified");
  await admin.page
    .getByRole("button", { name: "Record quality check" })
    .click();
  await reloadUntil(admin.page, "READY_FOR_COLLECTION");
  await admin.page.getByLabel("Received by").fill("E2E Customer");
  await admin.page.getByLabel(/I confirm/).check();
  await admin.page
    .getByRole("button", { name: "Confirm handover and complete" })
    .click();
  await reloadUntil(admin.page, "COMPLETED");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Repair report" }),
  ).toBeVisible();
  await expect(
    page.getByText("Replaced failed power controller", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Warranty: 90 days")).toBeVisible();
  await expect(page.getByText(/Received by E2E Customer/)).toBeVisible();
  await page.getByLabel("5 stars").check();
  await page
    .getByLabel(/Comment/)
    .fill("The complete repair workflow was clear and reliable.");
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(
    page.getByRole("heading", { name: "Your review" }),
  ).toBeVisible();
  await admin.page.goto("/admin/reports");
  await capture(admin.page, "14-reports");
  await Promise.all([
    customer.close(),
    admin.context.close(),
    technician.context.close(),
  ]);
});
