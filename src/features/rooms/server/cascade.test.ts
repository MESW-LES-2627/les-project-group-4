import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// US-05 / US-13: deleteRoom() only deletes the room row; PostgreSQL removes its layouts and
// their items through these foreign keys. The route tests mock the database, so this guards
// the migrations: a later migration that drops the cascade would fail here. The end-to-end
// check on a real database is the manual US-05 AT-5 (tests/acceptance/overrides.json).

const MIGRATIONS = fileURLToPath(new URL('../../../../prisma/migrations', import.meta.url))

/** The last statement in the migrations, in order, that mentions this constraint. */
function lastDefinition(constraint: string): string | undefined {
  return readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => readFileSync(join(MIGRATIONS, name, 'migration.sql'), 'utf8'))
    .join('\n')
    .split(';')
    .filter((statement) => statement.includes(`"${constraint}"`))
    .at(-1)
}

describe('room deletion cascade (migrations)', () => {
  it('deletes a room\'s layouts with it (layout.room_id ON DELETE CASCADE)', () => {
    const fk = lastDefinition('layout_room_id_fkey')
    expect(fk).toMatch(/FOREIGN KEY \("room_id"\) REFERENCES "room"\("id"\) ON DELETE CASCADE/)
  })

  it('deletes a layout\'s items with it (layout_item.layout_id ON DELETE CASCADE)', () => {
    const fk = lastDefinition('layout_item_layout_id_fkey')
    expect(fk).toMatch(/FOREIGN KEY \("layout_id"\) REFERENCES "layout"\("id"\) ON DELETE CASCADE/)
  })
})
