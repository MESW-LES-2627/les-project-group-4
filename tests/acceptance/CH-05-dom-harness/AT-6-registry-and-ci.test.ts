import { execFileSync } from 'node:child_process'
import { join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'

import { acceptanceFilesForCheck } from '../../../tools/acceptance/acceptance-files'
import { BASELINE_PROJECTS } from '../../../tools/acceptance/baseline'
import { checkCoverage } from '../../../tools/acceptance/coverage'
import type { Overrides } from '../../../tools/acceptance/coverage'
import type { Registry } from '../../../tools/acceptance/registry'
import { read, ROOT } from '../files'

// AT-6 checks behaviour, not wording: the file list is the one acceptance:check
// uses, and the projects are what Vitest itself resolves (`vitest list`), so a
// reformatted config or workflow still passes and a real regression fails.
// That the components project runs in jsdom is checked by AT-1 ("runs in jsdom").

// The three ATs that were `manual` only because there was no DOM harness.
const NOW_AUTOMATED = ['US-01/AT-4', 'US-03/AT-1', 'US-03/AT-4']

const toPosix = (path: string) => path.replaceAll('\\', '/')
const isDomTest = (file: string) => file.endsWith('.dom.test.tsx')

/** The test files Vitest resolves for the given projects (all projects when none). */
function vitestList(projects: readonly string[] = []): Array<{ file: string; project: string }> {
  const output = execFileSync(
    process.execPath,
    [
      join(ROOT, 'node_modules/vitest/vitest.mjs'),
      'list',
      '--filesOnly',
      '--json',
      ...projects.flatMap((project) => ['--project', project]),
    ],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  )
  return (JSON.parse(output) as Array<{ file: string; projectName: string }>).map((entry) => ({
    file: toPosix(relative(ROOT, entry.file)),
    project: entry.projectName,
  }))
}

/** The `--project` names passed by the CI step with `id: acceptance`. */
function ciAcceptanceProjects(): string[] {
  const lines = read('.github/workflows/ci.yml').split(/\r?\n/)
  const stepStart = lines.findIndex((line) => /^\s+id:\s*acceptance\s*$/.test(line))
  expect(stepStart, 'ci.yml has a step with "id: acceptance"').toBeGreaterThan(-1)
  // The step ends where the next step ("- ...") at the same or a lower indent starts.
  const indent = lines[stepStart]!.search(/\S/)
  const end = lines.findIndex(
    (line, index) => index > stepStart && line.trim() !== '' && line.search(/\S/) < indent,
  )
  const step = lines.slice(stepStart, end === -1 ? undefined : end).join('\n')
  return [...step.matchAll(/--project(?:=|\s+)["']?([\w-]+)/g)].map((match) => match[1]!)
}

const sorted = (files: Array<{ file: string }>) => files.map((entry) => entry.file).sort()

describe(
  'AT-6 — Registry and no new CI job: component tests count, the overrides are gone, no browser',
  { tags: ['acceptance', 'CH-05', 'AT-6'] },
  () => {
    it('removes the three "no component test harness yet" overrides', () => {
      const overrides = JSON.parse(read('tests/acceptance/overrides.json')) as Overrides
      for (const key of NOW_AUTOMATED) expect(overrides).not.toHaveProperty(key)
    })

    it('acceptance:check reads the .dom.test.tsx files and counts their tags', () => {
      const registry = JSON.parse(read('tests/registry.json')) as Registry
      const overrides = JSON.parse(read('tests/acceptance/overrides.json')) as Overrides
      const files = acceptanceFilesForCheck()
      const report = checkCoverage(registry, files, overrides, { required: ['CH-05'] })
      const covered = new Set(report.pairs.map((pair) => `${pair.story}/${pair.at}`))

      expect(report.problems).toEqual([])
      for (const key of NOW_AUTOMATED) expect(covered).toContain(key)
      expect(report.uncovered.filter((at) => at.story === 'CH-05')).toEqual([])

      // Every component test Vitest runs is scanned by acceptance:check, with a tag pair.
      const scanned = files.map((entry) => toPosix(entry.file))
      const tagged = new Set(report.pairs.map((pair) => toPosix(pair.file)))
      const domTests = sorted(vitestList(['components']))
      expect(domTests.length).toBeGreaterThan(0)
      for (const file of domTests) {
        expect(scanned).toContain(file)
        expect(tagged).toContain(file)
      }
    })

    it('Vitest runs every .dom.test.tsx once, in the components project only', () => {
      const all = vitestList()
      const onDisk = acceptanceFilesForCheck()
        .map((entry) => toPosix(entry.file))
        .filter(isDomTest)
        .sort()

      expect(sorted(all.filter((entry) => isDomTest(entry.file)))).toEqual(onDisk)
      for (const entry of all.filter((item) => isDomTest(item.file))) {
        expect(entry.project).toBe('components')
      }
      expect(all.filter((entry) => entry.project === 'components').every((entry) => isDomTest(entry.file)))
        .toBe(true)
    })

    it('the existing CI acceptance step and the baseline run the component tests too', () => {
      const ciRun = sorted(vitestList(ciAcceptanceProjects()))
      const expected = sorted(
        vitestList().filter((entry) => entry.project === 'acceptance' || entry.project === 'components'),
      )

      expect(ciRun).toEqual(expected)
      // ...and no other step or job runs them (no new CI job for component tests).
      const ci = read('.github/workflows/ci.yml')
      expect([...ci.matchAll(/--project(?:=|\s+)["']?components\b/g)]).toHaveLength(1)
      expect(sorted(vitestList(BASELINE_PROJECTS))).toEqual(expected)
    })

    it('adds no browser runner: no Playwright, Puppeteer or Vitest browser mode', () => {
      const pkg = JSON.parse(read('package.json')) as Record<string, Record<string, string> | undefined>
      const dependencies = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })

      expect(dependencies.filter((name) => /playwright|puppeteer|@vitest\/browser/.test(name))).toEqual([])
      expect(read('.github/workflows/ci.yml')).not.toMatch(/playwright|puppeteer/i)
    })
  },
)
