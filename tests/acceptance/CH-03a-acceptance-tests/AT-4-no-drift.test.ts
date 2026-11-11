import { describe, expect, it } from 'vitest'

import {
  buildRegistry,
  isRegistryStale,
  serializeRegistry,
} from '../../../tools/acceptance/registry'

const issues = [
  {
    number: 37,
    title: 'US-15: Set my location',
    body: `## Acceptance tests

- [ ] **AT-1 — City:** Given the city list, when I choose Porto, then Porto is stored.
- [ ] **AT-2 — Geolocation:** Given permission, when I use my location, then coordinates are stored.
`,
  },
]

describe(
  'AT-4 — No drift: an edited issue or registry is detected',
  { tags: ['acceptance', 'CH-03a', 'AT-4'] },
  () => {
    const generated = buildRegistry(issues, 'owner/repo').registry
    const committed = serializeRegistry(generated)

    it('accepts a registry that matches the issues', () => {
      expect(isRegistryStale(committed, generated)).toBe(false)
    })

    it('detects an edited issue body', () => {
      const edited = buildRegistry(
        [
          {
            ...issues[0],
            body: issues[0].body.replace('AT-1 — City', 'AT-1 — Town'),
          },
        ],
        'owner/repo',
      ).registry

      expect(isRegistryStale(committed, edited)).toBe(true)
    })

    it('detects a hand-edited committed registry', () => {
      expect(
        isRegistryStale(committed.replace('"US-15"', '"US-16"'), generated),
      ).toBe(true)
    })

    it('detects a missing committed registry', () => {
      expect(isRegistryStale('', generated)).toBe(true)
    })
  },
)
