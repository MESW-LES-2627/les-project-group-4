import { describe, expect, it } from 'vitest'

import { exists, listFiles } from './files'

const LIB_FILES = new Set(['db.ts', 'env.ts', 'http.ts', 'validation.ts', 'utils.ts'])

const COMPONENT_FILES = new Set([
  'src/components/form/FieldError.tsx',
  'src/components/form/TextField.tsx',
  'src/components/layout/AppHeader.tsx',
])

describe(
  'AT-5 — Small shared layer',
  { tags: ['acceptance', 'CH-04', 'AT-5'] },
  () => {
    it('keeps src/lib to infrastructure and its tests', () => {
      const files = listFiles('src/lib')
      expect(files.length).toBeGreaterThan(0)

      for (const file of files) {
        const name = file.slice('src/lib/'.length)
        const isInfrastructure = LIB_FILES.has(name)
        const isTest =
          /\.test\.ts$/.test(name) && LIB_FILES.has(name.replace(/\.test\.ts$/, '.ts'))

        expect(isInfrastructure || isTest, file).toBe(true)
      }
    })

    it('keeps src/components to shared UI', () => {
      const files = listFiles('src/components')
      expect(files.length).toBeGreaterThan(0)

      for (const file of files) {
        const isUi = file.startsWith('src/components/ui/') && file.endsWith('.tsx')
        const isAllowed = COMPONENT_FILES.has(file)

        expect(isUi || isAllowed, file).toBe(true)
      }
    })

    it('has no legacy shared folders', () => {
      for (const path of ['src/api', 'src/hooks', 'src/lib/schemas']) {
        expect(exists(path), path).toBe(false)
      }
    })
  },
)
