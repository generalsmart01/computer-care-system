import { describe, expect, it } from "vitest";
import { parseEnvironment } from "@/lib/env-schema";
import { sessionCookieOptions } from "@/lib/session-cookie";

const base = {
  MONGODB_URI: "mongodb+srv://application:password@cluster.example/database",
  SESSION_SECRET: "a-random-session-secret-with-more-than-32-characters-9274",
  APP_URL: "https://computer-care.example",
  NODE_ENV: "production",
  EMAIL_HOST: "smtp.example.com",
  EMAIL_PORT: "587",
  EMAIL_USER: "mailer",
  EMAIL_PASSWORD: "runtime-email-secret",
  EMAIL_FROM: "ComputerCare <support@example.com>",
  CLOUDINARY_CLOUD_NAME: "computer-care",
  CLOUDINARY_API_KEY: "runtime-key",
  CLOUDINARY_API_SECRET: "runtime-secret",
};

describe("Phase 65 production configuration", () => {
  it("accepts a complete production environment and coerces the SMTP port", () => {
    expect(parseEnvironment(base)).toMatchObject({ NODE_ENV: "production", EMAIL_PORT: 587, APP_URL: "https://computer-care.example" });
  });

  it("requires HTTPS and file storage in production", () => {
    expect(() => parseEnvironment({ ...base, APP_URL: "http://computer-care.example" })).toThrow(/HTTPS/);
    expect(() => parseEnvironment({ ...base, CLOUDINARY_API_SECRET: "" })).toThrow(/Cloudinary/);
  });

  it("rejects invalid database URIs, placeholder secrets, and partial Cloudinary setup", () => {
    expect(() => parseEnvironment({ ...base, MONGODB_URI: "https://database.example" })).toThrow(/MongoDB/);
    expect(() => parseEnvironment({ ...base, SESSION_SECRET: "replace-with-a-long-placeholder-secret" })).toThrow(/Placeholder/);
    expect(() => parseEnvironment({ ...base, NODE_ENV: "development", CLOUDINARY_API_SECRET: "" })).toThrow(/Cloudinary/);
  });

  it("enables secure, HTTP-only production cookies", () => {
    expect(sessionCookieOptions("production")).toMatchObject({ secure: true, httpOnly: true, sameSite: "lax", path: "/" });
    expect(sessionCookieOptions("development").secure).toBe(false);
  });

  it("limits the insecure override to loopback E2E infrastructure",()=>{
    const local={...base,APP_URL:"http://127.0.0.1:3100",MONGODB_URI:"mongodb://127.0.0.1:27017/computer-maintenance-e2e-test",ALLOW_INSECURE_LOCAL_E2E:"true"};
    expect(parseEnvironment(local).ALLOW_INSECURE_LOCAL_E2E).toBe("true");
    expect(sessionCookieOptions("production",true).secure).toBe(false);
    expect(()=>parseEnvironment({...base,ALLOW_INSECURE_LOCAL_E2E:"true"})).toThrow(/guarded E2E database/);
  });
});
