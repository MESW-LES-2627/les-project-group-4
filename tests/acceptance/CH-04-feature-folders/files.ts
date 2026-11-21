export {
  exists,
  importSpecifiers,
  isClientComponent,
  isDirectory,
  listFiles,
  localImports,
  read,
  resolveImport,
  ROOT,
  SRC,
} from '../files'

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
