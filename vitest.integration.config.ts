import{defineConfig}from"vitest/config";import path from"node:path";
export default defineConfig({test:{environment:"node",include:["tests/integration/**/*.test.ts"],fileParallelism:false,hookTimeout:30_000,testTimeout:30_000,setupFiles:["tests/integration/setup.ts"]},resolve:{alias:{"server-only":path.resolve(__dirname,"tests/integration/server-only.ts"),"@":path.resolve(__dirname,".")}}});
