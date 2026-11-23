import { describe, expect, it } from 'vitest'

import { FEATURES, exists, isDirectory, listFiles } from './files'

const FEATURE_FILES = listFiles('src/features')
const ALLOWED_ROOT_FILES = new Set(['api.ts', 'types.ts', 'schema.ts'])
const ALLOWED_DIRS = ['components/', 'hooks/', 'model/', 'server/']

const MOVED_OUT_OF_THE_SHARED_LAYERS = [
  'src/api',
  'src/hooks',
  'src/lib/schemas',
  'src/lib/catalog.ts',
  'src/lib/catalogFilters.ts',
  'src/lib/cities.ts',
  'src/lib/geolocation.ts',
  'src/lib/items.ts',
  'src/lib/layouts.ts',
  'src/lib/location.ts',
  'src/lib/roomFormat.ts',
  'src/lib/roomValidation.ts',
  'src/lib/rooms.ts',
  'src/lib/savedLayouts.ts',
  'src/lib/saveLayout.ts',
  'src/lib/seedData.ts',
  'src/lib/geometry',
  'src/lib/layout',
  'src/components/catalog',
  'src/components/plan',
  'src/components/rooms',
  'src/components/layouts',
]

describe(
  'AT-1 — One home per feature',
  { tags: ['acceptance', 'CH-04', 'AT-1'] },
  () => {
    it('has the four feature folders', () => {
      for (const feature of FEATURES) {
        expect(isDirectory(`src/features/${feature}`), feature).toBe(true)
      }
    })

    it('keeps every feature file under one feature folder', () => {
      expect(FEATURE_FILES.length).toBeGreaterThan(0)

      for (const file of FEATURE_FILES) {
        expect(FEATURES, file).toContain(file.split('/')[2])
      }
    })

    it('uses only the standard feature internals', () => {
      for (const file of FEATURE_FILES) {
        const insideFeature = file.split('/').slice(3).join('/')
        const rootFile = ALLOWED_ROOT_FILES.has(insideFeature)
        const testFile = /\.test\.(ts|tsx)$/.test(insideFeature)
        const folder = ALLOWED_DIRS.some((dir) => insideFeature.startsWith(dir))

        expect(rootFile || testFile || folder, file).toBe(true)
      }
    })

    it('has no feature code left in the shared layers', () => {
      for (const path of MOVED_OUT_OF_THE_SHARED_LAYERS) {
        expect(exists(path), path).toBe(false)
      }
    })
  },
)
