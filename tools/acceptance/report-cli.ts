// Prints the acceptance report from a Vitest JSON file.
//
//   npm run acceptance:report -- --head reports/head.json
//
// In CI the same command also appends a Markdown table to
// $GITHUB_STEP_SUMMARY, which is what reviewers see on the job page.

import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { formatMarkdown, formatText, summariseByAt } from "./report";
import type { VitestJsonReport } from "./report";
import type { Registry } from "./registry";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const headPath = argValue("--head");
if (!headPath) {
  console.error(
    "Usage: npm run acceptance:report -- --head <vitest.json> [--registry <registry.json>]",
  );
  process.exit(1);
}

const registryPath = argValue("--registry") ?? join(ROOT, "tests/registry.json");

const head = JSON.parse(readFileSync(headPath, "utf8")) as VitestJsonReport;
const registry = JSON.parse(readFileSync(registryPath, "utf8")) as Registry;

const summary = summariseByAt(head, registry);
console.log(formatText(summary));

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  appendFileSync(summaryPath, `${formatMarkdown(summary, registry.repository)}\n`);
}
