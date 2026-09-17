import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/lib/presentation";

describe("currency presentation", () => {
  it("formats application money as Nigerian naira", () => {
    const value = formatCurrency(125000);
    expect(value).toContain("₦");
    expect(value).toContain("125,000.00");
    expect(value).not.toContain("$");
  });
});
