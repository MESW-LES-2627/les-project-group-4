import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { exists, FEATURES, isDirectory, read, ROOT } from './files'

const DOC = 'docs/iterations/3/folder-structure.md'
const README = 'README.md'

const DOCUMENTED_TREE = [
  'features/',
  'catalog/',
  'locations/',
  'plan/',
  'rooms/',
  'components/',
  'lib/',
  'generated/',
  'prisma/seed-data/',
  'tests/acceptance/',
]

const DOCUMENTED_LIB_FILES = [
  'src/lib/db.ts',
  'src/lib/env.ts',
  'src/lib/http.ts',
  'src/lib/validation.ts',
  'src/lib/utils.ts',
]

describe(
  'AT-6 — Docs match tree',
  { tags: ['acceptance', 'CH-04', 'AT-6'] },
  () => {
    it('has the folder-structure document', () => {
      expect(exists(DOC), DOC).toBe(true)
    })

    it('documents the target tree', () => {
      const doc = read(DOC)
      expect(doc).toContain('## Target tree')

      for (const path of DOCUMENTED_TREE) {
        expect(doc, path).toContain(path)
      }
    })

    it('documents the real shared layer', () => {
      for (const path of DOCUMENTED_LIB_FILES) {
        expect(exists(path), path).toBe(true)
      }

      expect(isDirectory('prisma/seed-data'), 'prisma/seed-data').toBe(true)
      expect(isDirectory('tests/acceptance'), 'tests/acceptance').toBe(true)
    })

    it('matches the real top-level src folders', () => {
      const actual = readdirSync(join(ROOT, 'src'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name !== 'generated')
        .map((entry) => entry.name)
        .sort()

      expect(actual).toEqual(['app', 'components', 'features', 'lib'])

      for (const feature of FEATURES) {
        expect(isDirectory(`src/features/${feature}`), feature).toBe(true)
      }
    })

    it('keeps the README structure section accurate', () => {
      const readme = read(README)

      expect(readme).toContain('src/features/')
      expect(readme).toContain('src/lib/')
      expect(readme).toContain('src/components/')
      expect(readme).toContain('prisma/')
      expect(readme).toContain('docs/iterations/3/folder-structure.md')

      expect(readme).not.toContain('src/api/')
      expect(readme).not.toContain('src/hooks/')
      expect(readme).not.toContain('src/lib/schemas')
    })
  },
)
