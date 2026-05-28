import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "api",
          root: "./packages/api",
          environment: "node",
          globals: true,
        },
      },
      {
        test: {
          name: "web",
          root: "./packages/web",
          environment: "happy-dom",
          globals: true,
        },
      },
    ],
  },
});
