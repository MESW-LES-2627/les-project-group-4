import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
export const SRC = join(ROOT, 'src')

const IGNORED = new Set(['node_modules', '.git', '.next', 'coverage', 'dist'])

/** Every file under `directory`, relative to the repo root, with `/` separators. */
export function listFiles(directory: string): string[] {
  if (!existsSync(directory)) return []

  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.') && !IGNORED.has(entry.name))
    .flatMap((entry) => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return listFiles(path)
      return [relative(ROOT, path).split(sep).join('/')]
    })
}

export function exists(path: string): boolean {
  return existsSync(join(ROOT, path))
}

export function isDirectory(path: string): boolean {
  const absolute = join(ROOT, path)
  return existsSync(absolute) && statSync(absolute).isDirectory()
}

export function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8')
}

const IMPORT_PATTERN = /(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g

/** The module specifiers a file imports or re-exports. */
export function importSpecifiers(source: string): string[] {
  const found = new Set<string>()
  for (const match of source.matchAll(IMPORT_PATTERN)) {
    if (match[1] !== undefined) found.add(match[1])
  }
  return [...found]
}

/**
 * Resolves an `@/...` or relative import to a repo-relative path without its
 * extension. Package imports return null and are ignored by the boundary checks.
 */
export function resolveImport(fromFile: string, specifier: string): string | null {
  if (specifier.startsWith('@/')) {
    return join(SRC, specifier.slice(2))
      .replaceAll(sep, '/')
      .replace(/\.(ts|tsx)$/, '')
  }
  if (specifier.startsWith('.')) {
    const absolute = normalize(join(ROOT, dirname(fromFile), specifier))
    return absolute.split(sep).join('/').replace(/\.(ts|tsx)$/, '')
  }
  return null
}

/** Every local import of a file, as repo-relative paths without extensions. */
export function localImports(path: string): string[] {
  return importSpecifiers(read(path))
    .map((specifier) => resolveImport(path, specifier))
    .filter((resolved): resolved is string => resolved !== null)
}

export function isClientComponent(source: string): boolean {
  return /^\s*['"]use client['"]/.test(source)
}

export const FEATURES = ['catalog', 'locations', 'plan', 'rooms'] as const
export type Feature = (typeof FEATURES)[number]

/** The feature a path belongs to, or null when it is outside `src/features`. */
export function featureOf(path: string): Feature | null {
  const parts = path.split('/')
  if (parts[0] !== 'src' || parts[1] !== 'features') return null
  return (FEATURES as readonly string[]).includes(parts[2] ?? '')
    ? (parts[2] as Feature)
    : null
}
