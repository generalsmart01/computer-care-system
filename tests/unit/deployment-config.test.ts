import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(path, "utf8");

describe("Phase 66 single-unit deployment", () => {
  it("builds Next.js as a standalone monolith", () => {
    const config=source("next.config.ts");
    expect(config).toContain('process.env.VERCEL');
    expect(config).toContain('output: "standalone"');
    expect(source("Dockerfile")).toContain('CMD ["node", "server.js"]');
  });

  it("pins Vercel and Docker builds to the Node 22 major",()=>{
    expect(JSON.parse(source("package.json")).engines.node).toBe("22.x");
    expect(source("Dockerfile")).toContain("node:22-alpine");
  });

  it("runs the production container without root privileges", () => {
    const dockerfile = source("Dockerfile");
    expect(dockerfile).toContain("USER nextjs");
    expect(dockerfile).toContain("HEALTHCHECK");
    expect(dockerfile).toContain("EXPOSE 3000");
  });

  it("uses a database-backed readiness endpoint", () => {
    const health = source("app/api/health/route.ts");
    expect(health).toContain("admin().ping()");
    expect(health).toContain("status:503");
  });

  it("provides an explicit external production smoke command", () => {
    expect(source("package.json")).toContain('"smoke:production"');
    const smoke=source("playwright.smoke.config.ts");
    expect(smoke).toContain("SMOKE_BASE_URL");
    expect(smoke).toContain('target.protocol!=="https:"');
    expect(smoke).not.toContain("globalTeardown");
  });

  it("provides deterministic documentation screenshot capture",()=>{
    expect(source("package.json")).toContain('"docs:screenshots"');
    const journey=source("tests/e2e/successful-repair.spec.ts");
    expect(journey).toContain("CAPTURE_DOCUMENTATION");
    expect(journey).toContain('"01-homepage"');
    expect(journey).toContain('"14-reports"');
  });
});
