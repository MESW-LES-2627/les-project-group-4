import { describe, expect, it, vi } from 'vitest'

import type { PrismaClient } from '@/generated/prisma/client'

import { pingDatabase } from './db'

describe('pingDatabase', () => {
  it('runs SELECT 1', async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ '?column?': 1 }])
    const db = { $queryRaw: queryRaw } as unknown as PrismaClient

    await pingDatabase(db)

    expect(queryRaw).toHaveBeenCalledTimes(1)
    expect(queryRaw.mock.calls[0][0].join('')).toContain('SELECT 1')
  })
})
