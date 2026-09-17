import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  test: {
    environment: "node",
    exclude: ["tests/integration/**", "tests/e2e/**", "node_modules/**"],
    coverage: { reporter: ["text"] },
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
