import { describe, expect, it } from 'vitest'

import { checkCoverage } from '../../../tools/acceptance/coverage'
import type { Registry } from '../../../tools/acceptance/registry'

const registry: Registry = {
  repository: 'owner/repo',
  stories: {
    'US-15': {
      issue: 37,
      title: 'Set my location',
      ats: [
        { id: 'AT-1', title: 'City' },
        { id: 'AT-2', title: 'Geolocation' },
      ],
    },
  },
}

const tagged = (story: string, at: string) => ({
  file: `${story}-${at}.test.ts`,
  source: `it('x', { tags: ['acceptance', '${story}', '${at}'] }, () => {})`,
})

describe(
  'AT-3 — Coverage gate: unknown tags and uncovered ATs are failures',
  { tags: ['acceptance', 'CH-03a', 'AT-3'] },
  () => {
    it('reports a tag that is not in the registry', () => {
      const report = checkCoverage(registry, [tagged('US-99', 'AT-1')])

      expect(report.problems.map((problem) => problem.message)).toContain(
        'unknown tag US-99/AT-1',
      )
    })

    it('reports a started story AT with no test', () => {
      const report = checkCoverage(registry, [tagged('US-15', 'AT-1')])

      expect(report.uncovered.map((at) => at.key)).toEqual(['US-15/AT-2'])
    })
  },
)
