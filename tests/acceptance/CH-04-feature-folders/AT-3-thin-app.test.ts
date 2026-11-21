import { describe, expect, it } from 'vitest'

import { listFiles, localImports, read } from './files'

const APP_FILES = listFiles('src/app').filter(
  (file) => /\.(ts|tsx)$/.test(file) && !/\.test\.(ts|tsx)$/.test(file),
)

describe(
  'AT-3 — Thin app layer',
  { tags: ['acceptance', 'CH-04', 'AT-3'] },
  () => {
    it('has app files to check', () => {
      expect(APP_FILES.length).toBeGreaterThan(0)
    })

    it('does not query the database from src/app', () => {
      for (const file of APP_FILES) {
        const source = read(file)

        expect(source, file).not.toMatch(/\bgetDb\b/)
        expect(source, file).not.toMatch(/\$queryRaw|\$transaction|\bPrisma\./)
      }
    })

    it('does not import Prisma or feature model logic', () => {
      for (const file of APP_FILES) {
        for (const target of localImports(file)) {
          expect(target.startsWith('src/generated/'), `${file} imports generated Prisma`).toBe(
            false,
          )
          expect(
            target.startsWith('src/features/') && target.includes('/model/'),
            `${file} imports feature model logic`,
          ).toBe(false)
        }
      }
    })
  },
)
