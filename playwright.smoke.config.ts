import { defineConfig, devices } from "@playwright/test";

const baseURL=process.env.SMOKE_BASE_URL;
if(!baseURL)throw new Error("SMOKE_BASE_URL is required");
const target=new URL(baseURL);
if(target.protocol!=="https:"&&process.env.SMOKE_ALLOW_HTTP!=="1")throw new Error("Production smoke tests require HTTPS");
for(const name of ["SMOKE_ADMIN_EMAIL","SMOKE_TECHNICIAN_EMAIL","SMOKE_PASSWORD","SMOKE_SERVICE_NAME"] as const)if(!process.env[name])throw new Error(`${name} is required`);
process.env.SMOKE_RUN_ID||=`${Date.now()}`;

export default defineConfig({
  testDir:"tests/e2e",
  testMatch:"successful-repair.spec.ts",
  fullyParallel:false,
  workers:1,
  retries:0,
  timeout:180_000,
  expect:{timeout:30_000},
  use:{baseURL,trace:"retain-on-failure",screenshot:"only-on-failure"},
  projects:[{name:"chromium",use:{...devices["Desktop Chrome"]}}],
});
