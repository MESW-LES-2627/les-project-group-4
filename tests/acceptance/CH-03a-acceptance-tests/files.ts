import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('../../../', import.meta.url))

const IGNORED = new Set(['node_modules', '.git', '.next', 'coverage', 'dist'])

/** Every `*.test.ts(x)` file in the repository, as a path relative to ROOT. */
export function testFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.') && !IGNORED.has(entry.name))
    .flatMap((entry) => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return testFiles(path)
      if (!/\.test\.(ts|tsx)$/.test(entry.name)) return []
      return [relative(ROOT, path)]
    })
}

export function acceptanceTestFiles(): string[] {
  return testFiles(join(ROOT, 'tests/acceptance'))
}
