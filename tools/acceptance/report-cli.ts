// Prints the acceptance report from a Vitest JSON file.
//
//   npm run acceptance:report -- --head reports/head.json
//   npm run acceptance:report -- --head reports/head.json --base reports/base.json
//
// With --base the ATs are labelled regression / new / pre-existing / fixed
// against the merge-base run. In CI the same command also appends the grouped
// Markdown summary to $GITHUB_STEP_SUMMARY and prints GitHub annotations.

import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  changeLabels,
  classify,
  formatAnnotations,
  formatClassifiedText,
  formatCounts,
} from "./classify";
import type { Overrides } from "./coverage";
import { formatText, summariseByAt } from "./report";
import type { VitestJsonReport } from "./report";
import type { Registry } from "./registry";
import { buildGroupedReport, formatGroupedMarkdown } from "./summary";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const headPath = argValue("--head");
if (!headPath) {
  console.error(
    "Usage: npm run acceptance:report -- --head <vitest.json> " +
      "[--base <vitest.json>] [--registry <registry.json>]",
  );
  process.exit(1);
}

const basePath = argValue("--base");
const registryPath =
  argValue("--registry") ?? join(ROOT, "tests/registry.json");
const overridesPath = join(ROOT, "tests/acceptance/overrides.json");

const head = JSON.parse(readFileSync(headPath, "utf8")) as VitestJsonReport;
const registry = JSON.parse(readFileSync(registryPath, "utf8")) as Registry;
const overrides: Overrides = existsSync(overridesPath)
  ? (JSON.parse(readFileSync(overridesPath, "utf8")) as Overrides)
  : {};

const headSummary = summariseByAt(head, registry);

let text: string;
let markdown: string;
let annotations: string[] = [];

if (basePath && existsSync(basePath)) {
  const base = JSON.parse(readFileSync(basePath, "utf8")) as VitestJsonReport;
  const classification = classify(summariseByAt(base, registry), headSummary);
  const labels = changeLabels(classification);

  text = formatClassifiedText(classification);
  annotations = formatAnnotations(classification);
  markdown =
    `${formatCounts(classification)}\n\n` +
    formatGroupedMarkdown(
      buildGroupedReport(headSummary, registry, overrides),
      registry.repository,
      labels,
    );
} else {
  if (basePath) {
    console.warn(`Baseline not found at ${basePath}; reporting without it.`);
  }
  text = formatText(headSummary);
  markdown = formatGroupedMarkdown(
    buildGroupedReport(headSummary, registry, overrides),
    registry.repository,
  );
}

console.log(text);
for (const annotation of annotations) console.log(annotation);

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  appendFileSync(summaryPath, `${markdown}\n`);
}
