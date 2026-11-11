import { describe, expect, it } from 'vitest'

import { ROOT, acceptanceTestFiles, testFiles } from './files'

const UNIT_ROOTS = ['src/', 'tools/']
const ACCEPTANCE_TEST =
  /^tests\/acceptance\/(?:US|CH)-\d+[a-z]?-[^/]+\/.+\.test\.(?:ts|tsx)$/

describe(
  'AT-1 — Structure: tests live in the unit or story-scoped acceptance suite',
  { tags: ['acceptance', 'CH-03a', 'AT-1'] },
  () => {
    it('keeps every test in an allowed location', () => {
      const files = testFiles(ROOT)

      expect(files.length).toBeGreaterThan(0)
      for (const file of files) {
        const unit = UNIT_ROOTS.some((root) => file.startsWith(root))
        expect(unit || ACCEPTANCE_TEST.test(file)).toBe(true)
      }
    })

    it('keeps unit tests under src/', () => {
      expect(testFiles(ROOT).some((file) => file.startsWith('src/'))).toBe(true)
    })

    it('puts every acceptance test under a story directory', () => {
      const files = acceptanceTestFiles()

      expect(files.length).toBeGreaterThan(0)
      for (const file of files) expect(ACCEPTANCE_TEST.test(file)).toBe(true)
    })
  },
)
