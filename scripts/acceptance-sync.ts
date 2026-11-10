// Regenerates tests/registry.json from the GitHub issues.
//
//   npm run acceptance:sync              write the registry
//   npm run acceptance:sync -- --check   fail if the committed file is stale
//
// The issue body is the source of truth, so editing an AT in an issue means
// re-running this script. Automation status lives in
// tests/acceptance/overrides.json and is never written here.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  buildRegistry,
  serializeRegistry,
} from "../src/lib/acceptance/registry";
import type { IssueInput } from "../src/lib/acceptance/registry";

const REGISTRY_PATH = fileURLToPath(
  new URL("../tests/registry.json", import.meta.url),
);
const ISSUE_FIELDS = ["number", "title", "body"];

function gh(args: string[]): string {
  try {
    return execFileSync("gh", args, { encoding: "utf8" }).trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`gh ${args.join(" ")} failed:\n${message}`);
  }
}

function listIssues(): IssueInput[] {
  const json = gh([
    "issue",
    "list",
    "--state",
    "all",
    "--limit",
    "500",
    "--json",
    ISSUE_FIELDS.join(","),
  ]);

  return JSON.parse(json) as IssueInput[];
}

function repository(): string {
  // GITHUB_REPOSITORY is set by Actions; fall back to gh locally.
  return (
    process.env.GITHUB_REPOSITORY ??
    gh(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"])
  );
}

const issues = listIssues().filter((issue) =>
  issue.body?.includes("## Acceptance tests"),
);

const { registry, skipped } = buildRegistry(issues, repository());
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
