import { describe, expect, it } from 'vitest'

import { LOCAL_DATABASE_URL, resolveDatabaseUrl } from './databaseUrl'

describe('resolveDatabaseUrl', () => {
  it('uses DATABASE_URL when it is set', () => {
    const url = 'postgresql://user:secret@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'

    expect(resolveDatabaseUrl({ DATABASE_URL: url, NODE_ENV: 'production' })).toBe(url)
  })

  it('falls back to the docker-compose database outside production', () => {
    expect(resolveDatabaseUrl({ NODE_ENV: 'development' })).toBe(LOCAL_DATABASE_URL)
    expect(resolveDatabaseUrl({ NODE_ENV: 'test' })).toBe(LOCAL_DATABASE_URL)
    expect(resolveDatabaseUrl({})).toBe(LOCAL_DATABASE_URL)
  })

  it('fails loudly in production when DATABASE_URL is missing', () => {
    expect(() => resolveDatabaseUrl({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL is not set/)
  })

  it('treats an empty DATABASE_URL as missing', () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: '', NODE_ENV: 'development' })).toBe(
      LOCAL_DATABASE_URL,
    )
    expect(() => resolveDatabaseUrl({ DATABASE_URL: '', NODE_ENV: 'production' })).toThrow(
      /DATABASE_URL is not set/,
    )
  })

  it('does not leak the local connection string in the production error', () => {
    expect(() => resolveDatabaseUrl({ NODE_ENV: 'production' })).not.toThrow(LOCAL_DATABASE_URL)
  })
})
