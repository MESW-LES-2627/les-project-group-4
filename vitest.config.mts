import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const registry = JSON.parse(
  readFileSync(new URL('./tests/registry.json', import.meta.url), 'utf8'),
) as { stories: Record<string, { ats: Array<{ id: string }> }> }

const storyTags = Object.keys(registry.stories)
const atTags = [
  ...new Set(
    Object.values(registry.stories).flatMap((story) =>
      story.ats.map((at) => at.id),
    ),
  ),
]

const tags = [
  { name: 'acceptance' },
  ...storyTags.map((name) => ({ name })),
  ...atTags.map((name) => ({ name })),
]

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Next resolves `server-only` per bundling layer. In plain Node/Vitest the
      // package throws by design, so tests use a no-op marker instead.
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    // Story and AT tags are generated from the committed registry, so Vitest
    // rejects any tag that is not declared here.
    tags,
    strictTags: true,
    // Two suites with different jobs: unit tests stay next to the code they
    // cover, acceptance tests are grouped by story under tests/acceptance/.
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          // App tests stay in src/; repo tooling tests live under tools/.
          include: ['src/**/*.test.{ts,tsx}', 'tools/**/*.test.{ts,tsx}'],
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
