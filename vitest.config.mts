import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": resolve(import.meta.dirname, ".") },
  },
  test: {
    // Node by default - the content engine and the maths do not need a DOM.
    // Component tests opt in with `// @vitest-environment jsdom`.
    environment: "node",
    // Testing Library registers its own afterEach cleanup only when vitest's
    // globals are on; without it every render leaks into the next test.
    globals: true,
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
