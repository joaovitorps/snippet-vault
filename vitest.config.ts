import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        name: 'api',
        root: './packages/api',
        environment: 'node',
      },
      {
        name: 'web',
        root: './packages/web',
        environment: 'happy-dom',
        globals: true,
      },
    ],
  },
})
