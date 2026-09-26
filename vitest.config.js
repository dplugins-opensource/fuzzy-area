import { defineConfig } from "vitest/config";

// Pure-logic tests run in Node; DOM tests opt into jsdom with a
// `// @vitest-environment jsdom` comment at the top of the file.
export default defineConfig({
    test: {
        include: ["tests/**/*.test.js"],
        environment: "node",
        restoreMocks: true,
    },
});
