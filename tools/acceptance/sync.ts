// Regenerates tests/registry.json from the GitHub issues.
//
//   npm run acceptance:sync            write the registry
//   npm run acceptance:sync -- --check fail if the committed file is stale
//
// The issue body is the source of truth, so editing an AT in an issue means
// re-running this script. Automation status lives in
// tests/acceptance/overrides.json and is never written here.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { listIssuesWithAcceptanceTests, resolveRepository } from "./github";
import { buildRegistry, serializeRegistry } from "./registry";

const REGISTRY_PATH = fileURLToPath(
  new URL("../../tests/registry.json", import.meta.url),
);

const { registry, skipped } = buildRegistry(
  listIssuesWithAcceptanceTests(),
  resolveRepository(),
);
const output = serializeRegistry(registry);

const storyCount = Object.keys(registry.stories).length;
const atCount = Object.values(registry.stories).reduce(
  (total, story) => total + story.ats.length,
  0,
);

if (process.argv.includes("--check")) {
  const existing = existsSync(REGISTRY_PATH)
    ? readFileSync(REGISTRY_PATH, "utf8")
    : "";
  if (existing !== output) {
    console.error(
      "tests/registry.json is out of date. Run `npm run acceptance:sync` and commit the result.",
    );
    process.exitCode = 1;
  } else {
    console.log(
      `tests/registry.json is up to date (${storyCount} stories, ${atCount} ATs).`,
    );
  }
} else {
  writeFileSync(REGISTRY_PATH, output);
  console.log(
    `Wrote tests/registry.json (${storyCount} stories, ${atCount} ATs).`,
  );
}

if (skipped.length > 0) {
  const numbers = skipped
    .map((issue) => issue.issue)
    .sort((a, b) => a - b)
    .map((number) => `#${number}`)
    .join(", ");
  console.warn(
    `Skipped ${skipped.length} issue(s) whose title has no US-/CH- key: ${numbers}`,
  );
}
