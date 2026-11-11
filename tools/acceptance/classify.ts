// Compares the head results with the merge-base run so a failure can be
// labelled for what it is:
//
//   regression     passed on the base, fails now
//   new            did not exist on the base, fails now
//   pre-existing   already failed on the base, still fails
//   fixed          failed on the base, passes now
//   removed        existed on the base, no longer runs
//   failed         fails, with no baseline to compare against

import { relative } from "node:path";

import { formatText } from "./report";
import type { AtResult, AtStatus, AtSummary } from "./report";

export type ChangeKind =
  | "regression"
  | "new"
  | "pre-existing"
  | "fixed"
  | "removed"
  | "failed"
  | "skipped"
  | "pass";

export interface ClassifiedAt {
  result: AtResult;
  baseStatus: AtStatus | null;
  kind: ChangeKind;
}

export interface Classification {
  head: AtSummary;
  entries: ClassifiedAt[];
  counts: Record<ChangeKind, number>;
}

const LABELS: Record<ChangeKind, string> = {
  regression: "regression",
  new: "new test",
  "pre-existing": "pre-existing",
  fixed: "fixed",
  removed: "removed",
  failed: "failed",
  skipped: "skipped",
  pass: "",
};

export function classify(
  base: AtSummary | null,
  head: AtSummary,
): Classification {
  const counts: Record<ChangeKind, number> = {
    regression: 0,
    new: 0,
    "pre-existing": 0,
    fixed: 0,
    removed: 0,
    failed: 0,
    skipped: 0,
    pass: 0,
  };

  const baseByKey = new Map(
    (base?.results ?? []).map((result) => [result.key, result]),
  );
  const headKeys = new Set(head.results.map((result) => result.key));
  const entries: ClassifiedAt[] = [];

  for (const result of head.results) {
    const previous = baseByKey.get(result.key);
    const kind = classifyOne(result, previous ?? null, base !== null);

    entries.push({ result, baseStatus: previous?.status ?? null, kind });
    counts[kind] += 1;
  }

  if (base) {
    const removed = base.results
      .filter((result) => !headKeys.has(result.key))
      .sort((a, b) => a.key.localeCompare(b.key));

    for (const result of removed) {
      entries.push({ result, baseStatus: result.status, kind: "removed" });
      counts.removed += 1;
    }
  }

  return { head, entries, counts };
}

function classifyOne(
  result: AtResult,
  previous: AtResult | null,
  hasBaseline: boolean,
): ChangeKind {
  if (result.status === "failed") {
    if (!hasBaseline) return "failed";
    if (!previous) return "new";
    if (previous.status === "passed") return "regression";
    if (previous.status === "failed") return "pre-existing";
    return "new";
  }

  if (result.status === "passed") {
    return previous?.status === "failed" ? "fixed" : "pass";
  }

  return "skipped";
}

/** Key → label for the formatters; passing ATs get an empty label. */
export function changeLabels(
  classification: Classification,
): Record<string, string> {
  return Object.fromEntries(
    classification.entries.map((entry) => [
      entry.result.key,
      LABELS[entry.kind],
    ]),
  );
}

export function formatCounts(classification: Classification): string {
  const { counts } = classification;
  return (
    `Regressions: ${counts.regression} · new failures: ${counts.new} · ` +
    `pre-existing: ${counts["pre-existing"]} · fixed: ${counts.fixed} · ` +
    `removed: ${counts.removed}`
  );
}

export function formatClassifiedText(classification: Classification): string {
  return `${formatCounts(classification)}\n${formatText(
    classification.head,
    changeLabels(classification),
  )}`;
}

/**
 * GitHub Actions annotations. Regressions and new failures are errors, a
 * pre-existing failure is a warning so it does not look like this PR broke it.
 */
export function formatAnnotations(classification: Classification): string[] {
  const annotations: string[] = [];

  for (const entry of classification.entries) {
    if (
      entry.kind !== "regression" &&
      entry.kind !== "new" &&
      entry.kind !== "pre-existing" &&
      entry.kind !== "failed"
    ) {
      continue;
    }

    const test = entry.result.tests.find(
      (candidate) => candidate.status === "failed",
    );
    if (!test) continue;

    const level = entry.kind === "pre-existing" ? "warning" : "error";
    const file = escapeProperty(relative(process.cwd(), test.file));
    const line = test.line ? `,line=${test.line}` : "";
    const title = escapeProperty(
      `${entry.result.key} — issue #${entry.result.issue} (${LABELS[entry.kind]})`,
    );
    const message = escapeData(
      (test.messages[0] ?? "failed").split("\n")[0].slice(0, 500),
    );

    annotations.push(
      `::${level} file=${file}${line},title=${title}::${message}`,
    );
  }

  return annotations;
}

function escapeData(value: string): string {
  return value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

function escapeProperty(value: string): string {
  return escapeData(value).replace(/:/g, "%3A").replace(/,/g, "%2C");
}
