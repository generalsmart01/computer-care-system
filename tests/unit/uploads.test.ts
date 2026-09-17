import { describe, expect, it } from "vitest";
import { safeFilename, validateUploads } from "@/features/uploads/upload.validation";

describe("upload security", () => {
  it("removes unsafe filename characters", () => {
    expect(safeFilename("../../bad file<script>.png")).toBe(".._.._bad_file_script_.png");
  });

  it("rejects more than five files before processing content", () => {
    expect(() => validateUploads(Array(6).fill({}) as File[])).toThrow("maximum of 5");
  });
});
