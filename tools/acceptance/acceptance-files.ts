// The acceptance test files that `npm run acceptance:check` scans for tags.
// Shared so CH-05/AT-6 checks the same file list as the CLI instead of a copy:
// if the CLI stopped finding a kind of file (e.g. `*.dom.test.tsx`), the test
// would fail too.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ACCEPTANCE_DIR = join(ROOT, "tests/acceptance");

/** Every `*.test.ts(x)` under tests/acceptance, with its source, sorted by path. */
export function acceptanceFilesForCheck(): Array<{ file: string; source: string }> {
  if (!existsSync(ACCEPTANCE_DIR)) return [];

  return readdirSync(ACCEPTANCE_DIR, { recursive: true, encoding: "utf8" })
    .filter((name) => /\.test\.(ts|tsx)$/.test(name))
    .sort()
    .map((name) => ({
      file: join("tests/acceptance", name),
      source: readFileSync(join(ACCEPTANCE_DIR, name), "utf8"),
    }));
}
