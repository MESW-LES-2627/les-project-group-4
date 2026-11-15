// Checks the acceptance tests against the registry.
//
//   npm run acceptance:check                fail on any gap (default)
//   npm run acceptance:check -- --warn      report problems, exit 0
//   npm run acceptance:check -- --drift-warn report registry drift, do not fail
//   npm run acceptance:check -- --offline   skip the registry drift check
//
// --strict is still accepted for backwards compatibility; it is the default.
// Warn mode is for local inspection of the gaps. Drift is fatal by default;
// CI relaxes it for runs that cannot be held responsible for the registry.
// --drift-fail is the explicit default, so CI can pass --drift-<mode>.

import { existsSync, readFileSync, readdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { checkCoverage } from "./coverage";
import type { Overrides } from "./coverage";
import { listIssuesWithAcceptanceTests, resolveRepository } from "./github";
import { linkedIssuesForPullRequest, storyKeysForIssues } from "./issues";
import { buildRegistry, isRegistryStale } from "./registry";
import type { Registry } from "./registry";
import { formatTraceabilityMarkdown } from "./traceability-summary";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const REGISTRY_PATH = join(ROOT, "tests/registry.json");
const OVERRIDES_PATH = join(ROOT, "tests/acceptance/overrides.json");
const ACCEPTANCE_DIR = join(ROOT, "tests/acceptance");

const warn = process.argv.includes("--warn");
const strict = !warn;
const offline = process.argv.includes("--offline");
const prNumber = argValue("--pr");

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function argValues(name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) {
      values.push(process.argv[index + 1]);
    }
  }
  return values;
}

// A stale registry is a real gap when the change owns the tests, so `fail` is
// the default. `warn` is for runs where an unrelated issue edit must not block.
const driftIsFatal = !process.argv.includes("--drift-warn");

const committed = readFileSync(REGISTRY_PATH, "utf8");
const registry = JSON.parse(committed) as Registry;

const overrides: Overrides = existsSync(OVERRIDES_PATH)
  ? (JSON.parse(readFileSync(OVERRIDES_PATH, "utf8")) as Overrides)
  : {};

const explicitIssues = argValues("--issue")
  .map((value) => Number(value))
  .filter((value) => Number.isInteger(value));

const linked = prNumber
  ? linkedIssuesForPullRequest(Number(prNumber)).issues
  : [];
const issues = [...new Set([...explicitIssues, ...linked])].sort((a, b) => a - b);
const { stories: requiredStories, unknown: unknownIssues } = storyKeysForIssues(
  registry,
  issues,
);

if (prNumber && issues.length === 0) {
  console.log(
    `PR #${prNumber} has no linked issue; skipping the per-issue coverage rule.`,
  );
}
for (const issue of unknownIssues) {
  console.log(`#${issue} is not a story in the registry; skipped.`);
}
if (requiredStories.length > 0) {
  console.log(
    `Required by ${issues.map((issue) => `#${issue}`).join(", ")}: ` +
      `${requiredStories.join(", ")}.`,
  );
}

const files = acceptanceFiles();
const report = checkCoverage(registry, files, overrides, {
  required: requiredStories,
});

const totalAts = Object.values(registry.stories).reduce(
  (total, story) => total + story.ats.length,
  0,
);
const notStartedAts = report.notStarted.reduce(
  (total, story) => total + (registry.stories[story]?.ats.length ?? 0),
  0,
);
const coveredAts =
  totalAts -
  report.uncovered.length -
  report.manual.length -
  report.coveredBy.length -
  notStartedAts;

let drift = false;
if (!offline) {
  const { registry: generated } = buildRegistry(
    listIssuesWithAcceptanceTests(),
    resolveRepository(),
  );
  drift = isRegistryStale(committed, generated);
}

console.log(
  `Acceptance tests: ${report.pairs.length} tagged group(s), ` +
    `${coveredAts}/${totalAts} ATs covered, ${report.manual.length} manual/deferred, ` +
    `${report.coveredBy.length} covered by another story.`,
);

if (report.notStarted.length > 0) {
  console.log(
    `${report.notStarted.length} story(ies) not started (${notStartedAts} ATs), ignored by the gate: ` +
      report.notStarted.join(", "),
  );
}

if (report.manual.length > 0) {
  console.log(`\n${report.manual.length} manual/deferred AT(s):`);
  for (const key of report.manual) console.log(`  ${key}`);
}

if (report.coveredBy.length > 0) {
  console.log(`\n${report.coveredBy.length} AT(s) covered by another story:`);
  for (const key of report.coveredBy) console.log(`  ${key}`);
}

if (report.problems.length > 0) {
  console.error(`\nProblems (${report.problems.length}):`);
  for (const problem of report.problems) {
    const location =
      problem.line > 0 ? `${problem.file}:${problem.line}` : problem.file;
    console.error(`  ${location}  ${problem.message}`);
  }
}

if (report.untagged.length > 0) {
  console.error(
    `\n${report.untagged.length} acceptance test file(s) without US/AT tags:`,
  );
  for (const file of report.untagged) console.error(`  ${file}`);
}

if (report.uncovered.length > 0) {
  const shown = report.uncovered.slice(0, 25);
  console.log(`\n${report.uncovered.length} AT(s) without a test:`);
  for (const at of shown) {
    console.log(
      `  ${at.key.padEnd(12)} ${at.title.padEnd(32)} #${at.issue} (${at.story})` +
        (at.required ? `  [required by #${at.issue}]` : ""),
    );
  }
  if (report.uncovered.length > shown.length) {
    console.log(`  ... and ${report.uncovered.length - shown.length} more`);
  }
}

if (drift) {
  const suffix = driftIsFatal
    ? ""
    : " (advisory here: this run does not own the tests, so it does not fail)";
  console.error(
    `\ntests/registry.json is out of date. Run \`npm run acceptance:sync\` and commit the result.${suffix}`,
  );
}

const failed =
  report.problems.length > 0 ||
  report.untagged.length > 0 ||
  report.uncovered.length > 0 ||
  (drift && driftIsFatal);

if (!failed) {
  console.log(
    drift
      ? "\nCoverage is complete; the registry drift above is advisory here."
      : "\nAll acceptance ATs are covered.",
  );
} else if (strict) {
  process.exitCode = 1;
} else {
  console.log("\nWarn mode: the gate would fail; rerun without --warn.");
}

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  appendFileSync(
    summaryPath,
    `${formatTraceabilityMarkdown({
      registry,
      report,
      issues,
      requiredStories,
      unknownIssues,
      drift,
      driftIsFatal,
    })}\n`,
  );
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
