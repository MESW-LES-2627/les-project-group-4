import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { checkCoverage } from '../../../tools/acceptance/coverage'
import type { Overrides } from '../../../tools/acceptance/coverage'
import type { Registry } from '../../../tools/acceptance/registry'
import { listFiles, read, ROOT } from '../files'

// The three ATs that were `manual` only because there was no DOM harness.
const NOW_AUTOMATED = ['US-01/AT-4', 'US-03/AT-1', 'US-03/AT-4']

const registry = JSON.parse(read('tests/registry.json')) as Registry
const overrides = JSON.parse(read('tests/acceptance/overrides.json')) as Overrides
const acceptanceFiles = listFiles(join(ROOT, 'tests/acceptance'))
  .filter((file) => /\.test\.(ts|tsx)$/.test(file))
  .map((file) => ({ file, source: read(file) }))

describe(
  'AT-6 — Registry and no new CI job: component tests count, the overrides are gone, no browser',
  { tags: ['acceptance', 'CH-05', 'AT-6'] },
  () => {
    it('removes the three "no component test harness yet" overrides', () => {
      for (const key of NOW_AUTOMATED) expect(overrides).not.toHaveProperty(key)
    })

    it('counts the tags of the .dom.test.tsx files as coverage in acceptance:check', () => {
      const report = checkCoverage(registry, acceptanceFiles, overrides, { required: ['CH-05'] })
      const covered = new Set(report.pairs.map((pair) => `${pair.story}/${pair.at}`))

      expect(report.problems).toEqual([])
      for (const key of NOW_AUTOMATED) expect(covered).toContain(key)
      expect(report.uncovered.filter((at) => at.story === 'CH-05')).toEqual([])
      expect(
        report.pairs.some((pair) => pair.story === 'US-01' && pair.file.endsWith('.dom.test.tsx')),
      ).toBe(true)
    })

    it('declares the components project in jsdom and keeps .dom tests out of acceptance', () => {
      const config = read('vitest.config.mts')

      expect(config).toContain("name: 'components'")
      expect(config).toContain("include: ['tests/acceptance/**/*.dom.test.tsx']")
      expect(config).toContain("environment: 'jsdom'")
      expect(config).toContain("'**/*.dom.test.tsx'")
    })

    it('runs the component tests in the existing acceptance job, with no browser download', () => {
      const ci = read('.github/workflows/ci.yml')
      const packageJson = read('package.json')

      expect(ci).toMatch(/npx vitest run --project acceptance --project components/)
      // The merge-base run includes them too, so the report can flag a regression in them.
      expect(read('tools/acceptance/baseline.ts')).toMatch(/"--project",\s*"components"/)
      expect(ci).not.toMatch(/^  components?:$/m)
      expect(ci).not.toMatch(/playwright|puppeteer|install-deps/i)
      expect(packageJson).not.toMatch(/playwright|puppeteer|@vitest\/browser/)
    })
  },
)
