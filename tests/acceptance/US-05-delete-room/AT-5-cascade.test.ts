import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, ROOT } from '../files'

// The cascade is done by PostgreSQL, not by the route: DELETE /api/rooms/[id] only deletes
// the room (AT-4), and the foreign keys remove its layouts and their items. The unit tests
// mock the database, so this AT checks the foreign keys the migrations create.

const MIGRATIONS = 'prisma/migrations'

/** The last statement in the migrations, in order, that defines this constraint. */
function lastDefinition(constraint: string): string | undefined {
  const sql = readdirSync(join(ROOT, MIGRATIONS), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => read(`${MIGRATIONS}/${name}/migration.sql`))
    .join('\n')
  return sql
    .split(';')
    .filter((statement) => statement.includes(`"${constraint}"`))
    .at(-1)
}

describe(
  'AT-5 — Cascade: deleting a room removes its saved layouts and their items',
  { tags: ['acceptance', 'US-05', 'AT-5'] },
  () => {
    it('a layout is deleted with its room (layout.room_id ON DELETE CASCADE)', () => {
      const fk = lastDefinition('layout_room_id_fkey')
      expect(fk).toMatch(/FOREIGN KEY \("room_id"\) REFERENCES "room"\("id"\)/)
      expect(fk).toMatch(/ON DELETE CASCADE/)
    })

    it('a layout item is deleted with its layout (layout_item.layout_id ON DELETE CASCADE)', () => {
      const fk = lastDefinition('layout_item_layout_id_fkey')
      expect(fk).toMatch(/FOREIGN KEY \("layout_id"\) REFERENCES "layout"\("id"\)/)
      expect(fk).toMatch(/ON DELETE CASCADE/)
    })
  },
)
