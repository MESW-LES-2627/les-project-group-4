import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { scanTags } from '../../../tools/acceptance/coverage'
import type { Registry } from '../../../tools/acceptance/registry'
import { ROOT, acceptanceTestFiles } from './files'

const registry = JSON.parse(
  readFileSync(join(ROOT, 'tests/registry.json'), 'utf8'),
) as Registry

describe(
  'AT-2 — Traceability: every acceptance test is tagged and maps to an issue',
  { tags: ['acceptance', 'CH-03a', 'AT-2'] },
  () => {
    it('tags every acceptance test with a story and AT in the registry', () => {
      const files = acceptanceTestFiles()

      expect(files.length).toBeGreaterThan(0)
      for (const file of files) {
        const source = readFileSync(join(ROOT, file), 'utf8')
        const { pairs, problems } = scanTags(file, source)

        expect(problems).toEqual([])
        expect(pairs.length).toBeGreaterThan(0)

        for (const pair of pairs) {
          const story = registry.stories[pair.story]

          expect(story).toBeDefined()
          expect(story?.ats.some((entry) => entry.id === pair.at)).toBe(true)
        }
      }
    })

    it('maps every registry story to an issue number', () => {
      for (const story of Object.values(registry.stories)) {
        expect(Number.isInteger(story.issue)).toBe(true)
        expect(story.issue).toBeGreaterThan(0)
      }
    })
  },
)
