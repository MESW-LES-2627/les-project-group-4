import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    // Two suites with different jobs: unit tests stay next to the code they
    // cover, acceptance tests are grouped by story under tests/acceptance/.
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'acceptance',
          include: ['tests/acceptance/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
})
