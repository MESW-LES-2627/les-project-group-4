import { describe, expect, it } from 'vitest'

import {
  featureOf,
  type Feature,
  isClientComponent,
  listFiles,
  localImports,
  read,
} from './files'

const SOURCE_FILES = listFiles('src').filter((file) => /\.(ts|tsx)$/.test(file))

const ALLOWED_FEATURE_IMPORTS: Record<Feature, Feature[]> = {
  // The catalog adds items to the current room's draft, so it may use plan state.
  catalog: ['plan'],
  // Locations and plan are the bottom of the feature graph.
  locations: [],
  plan: [],
  // Rooms is the top-level feature and may compose the other three.
  rooms: ['catalog', 'locations', 'plan'],
}

describe(
  'AT-4 — Boundaries',
  { tags: ['acceptance', 'CH-04', 'AT-4'] },
  () => {
    it('keeps the feature graph acyclic and in the documented direction', () => {
      for (const file of SOURCE_FILES) {
        const from = featureOf(file)
        if (from === null) continue

        for (const target of localImports(file)) {
          const to = featureOf(target)
          if (to === null || to === from) continue

          expect(
            ALLOWED_FEATURE_IMPORTS[from],
            `${file} must not import the ${to} feature`,
          ).toContain(to)
        }
      }
    })

    it('does not let plan import rooms', () => {
      for (const file of SOURCE_FILES.filter((path) => path.startsWith('src/features/plan/'))) {
        for (const target of localImports(file)) {
          expect(target.startsWith('src/features/rooms/'), `${file} imports rooms`).toBe(false)
        }
      }
    })

    it('does not let locations import a Room type', () => {
      for (const file of SOURCE_FILES.filter((path) =>
        path.startsWith('src/features/locations/'),
      )) {
        for (const target of localImports(file)) {
          expect(target.startsWith('src/features/rooms/'), `${file} imports rooms`).toBe(false)
        }
      }
    })

    it('does not let shared layers import features', () => {
      const shared = SOURCE_FILES.filter(
        (file) => file.startsWith('src/lib/') || file.startsWith('src/components/'),
      )

      for (const file of shared) {
        for (const target of localImports(file)) {
          expect(target.startsWith('src/features/'), `${file} imports a feature`).toBe(false)
        }
      }
    })

    it('does not let features import the app layer', () => {
      for (const file of SOURCE_FILES.filter((path) => path.startsWith('src/features/'))) {
        for (const target of localImports(file)) {
          expect(target.startsWith('src/app/'), `${file} imports src/app`).toBe(false)
        }
      }
    })

    it('does not let client components import server-only modules', () => {
      const clientFiles = SOURCE_FILES.filter((file) => isClientComponent(read(file)))

      for (const file of clientFiles) {
        for (const target of localImports(file)) {
          expect(target, `${file} imports the Prisma client`).not.toBe('src/lib/db')
          expect(target, `${file} imports env`).not.toBe('src/lib/env')
          expect(target.startsWith('src/generated/'), `${file} imports generated Prisma`).toBe(
            false,
          )
          expect(
            /^src\/features\/[^/]+\/server\//.test(target),
            `${file} imports a server module`,
          ).toBe(false)
        }
      }
    })
  },
)
