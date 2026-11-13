import { describe, expect, it } from 'vitest'

import { checkCoverage } from '../../../tools/acceptance/coverage'
import type { Overrides } from '../../../tools/acceptance/coverage'
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
    'CH-02': {
      issue: 42,
      title: 'Seed items, stores and cities',
      ats: [{ id: 'AT-1', title: 'Idempotent seed' }],
    },
  },
}

const overrides: Overrides = {
  'US-15/AT-1': { status: 'manual', note: 'needs a component harness' },
  'US-15/AT-2': { status: 'deferred', note: 'tracked in US-16' },
  'CH-02/AT-1': { status: 'covered-by', by: 'US-15' },
}

describe(
  'AT-5 — Manual ATs: manual and deferred ATs are reported, not blocked',
  { tags: ['acceptance', 'CH-03a', 'AT-5'] },
  () => {
    it('exempts manual, deferred and covered-by ATs from the failure list', () => {
      const report = checkCoverage(registry, [], overrides)

      expect(report.problems).toEqual([])
      expect(report.uncovered).toEqual([])
      expect(report.manual).toEqual(['US-15/AT-1', 'US-15/AT-2'])
      expect(report.coveredBy).toEqual(['CH-02/AT-1'])
    })
  },
)
