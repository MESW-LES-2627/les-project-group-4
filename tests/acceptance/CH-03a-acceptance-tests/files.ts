import { join } from 'node:path'

import { listFiles, ROOT } from '../files'

export { ROOT }

/** Every `*.test.ts(x)` file under `directory`, relative to the repo root. */
export function testFiles(directory: string): string[] {
  return listFiles(directory).filter((file) => /\.test\.(ts|tsx)$/.test(file))
}

export function acceptanceTestFiles(): string[] {
  return testFiles(join(ROOT, 'tests/acceptance'))
}
