// Checks the acceptance tests against the registry.
//
//   npm run acceptance:check              report problems, exit 0
//   npm run acceptance:check -- --strict  exit 1 when anything is wrong
//   npm run acceptance:check -- --offline skip the registry drift check
//
// Warn mode exists so the migration can land before every AT has a test.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { checkCoverage } from "./coverage";
import type { Overrides } from "./coverage";
import { listIssuesWithAcceptanceTests, resolveRepository } from "./github";
import { buildRegistry, serializeRegistry } from "./registry";
import type { Registry } from "./registry";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const REGISTRY_PATH = join(ROOT, "tests/registry.json");
const OVERRIDES_PATH = join(ROOT, "tests/acceptance/overrides.json");
const ACCEPTANCE_DIR = join(ROOT, "tests/acceptance");

const strict = process.argv.includes("--strict");
const offline = process.argv.includes("--offline");

const committed = readFileSync(REGISTRY_PATH, "utf8");
const registry = JSON.parse(committed) as Registry;

const overrides: Overrides = existsSync(OVERRIDES_PATH)
  ? (JSON.parse(readFileSync(OVERRIDES_PATH, "utf8")) as Overrides)
  : {};

const files = acceptanceFiles();
const report = checkCoverage(registry, files, overrides);

const totalAts = Object.values(registry.stories).reduce(
  (total, story) => total + story.ats.length,
  0,
);
const coveredAts =
  totalAts - report.uncovered.length - report.manual.length - report.coveredBy.length;

let drift = false;
if (!offline) {
  const { registry: generated } = buildRegistry(
    listIssuesWithAcceptanceTests(),
    resolveRepository(),
  );
  drift = serializeRegistry(generated) !== committed;
}

console.log(
  `Acceptance tests: ${report.pairs.length} tagged group(s), ` +
    `${coveredAts}/${totalAts} ATs covered, ${report.manual.length} manual/deferred, ` +
    `${report.coveredBy.length} covered by another story.`,
);

if (report.problems.length > 0) {
  console.error(`\nProblems (${report.problems.length}):`);
  for (const problem of report.problems) {
    const location =
      problem.line > 0 ? `${problem.file}:${problem.line}` : problem.file;
    console.error(`  ${location}  ${problem.message}`);
  }
}

if (report.uncovered.length > 0) {
  const shown = report.uncovered.slice(0, 25);
  console.log(`\n${report.uncovered.length} AT(s) without a test:`);
  for (const at of shown) {
    console.log(
      `  ${at.key.padEnd(12)} ${at.title.padEnd(32)} #${at.issue} (${at.story})`,
    );
  }
  if (report.uncovered.length > shown.length) {
    console.log(`  ... and ${report.uncovered.length - shown.length} more`);
  }
}

if (drift) {
  console.error(
    "\ntests/registry.json is out of date. Run `npm run acceptance:sync` and commit the result.",
  );
}

const failed =
  report.problems.length > 0 || report.uncovered.length > 0 || drift;

if (!failed) {
  console.log("\nAll acceptance ATs are covered.");
} else if (strict) {
  process.exitCode = 1;
} else {
  console.log("\nWarn mode: this would fail with --strict.");
}

function acceptanceFiles(): Array<{ file: string; source: string }> {
  if (!existsSync(ACCEPTANCE_DIR)) return [];

  return readdirSync(ACCEPTANCE_DIR, { recursive: true, encoding: "utf8" })
    .filter((name) => /\.test\.(ts|tsx)$/.test(name))
    .sort()
    .map((name) => ({
      file: join("tests/acceptance", name),
      source: readFileSync(join(ACCEPTANCE_DIR, name), "utf8"),
    }));
}
