// Turns a Vitest JSON report into a summary by story and acceptance test.
//
//   npx vitest run --project acceptance --reporter=json \
//     --includeTaskLocation --outputFile head.json
//   npm run acceptance:report -- --head head.json
//
// The tags on each test (`US-15`, `AT-3`) are the link to the issue; the report
// joins them with tests/registry.json for the story title and issue number.

import type { Registry } from "./registry";

const STORY_TAG = /^(?:US|CH)-\d+[a-z]?$/;
const AT_TAG = /^AT-\d+$/;

export interface VitestAssertion {
  fullName: string;
  status: string;
  failureMessages?: string[] | null;
  location?: { line: number; column: number } | null;
  tags?: string[];
}

export interface VitestFileResult {
  name: string;
  assertionResults: VitestAssertion[];
}

export interface VitestJsonReport {
  testResults?: VitestFileResult[];
}

export interface TaggedTest {
  story: string | null;
  at: string | null;
  file: string;
  line: number | null;
  fullName: string;
  status: string;
  messages: string[];
}

export type AtStatus = "passed" | "failed" | "skipped" | "not-run";

export interface AtResult {
  key: string;
  story: string;
  at: string;
  title: string;
  issue: number;
  /** False when the tag is not in the registry. */
  known: boolean;
  status: AtStatus;
  tests: TaggedTest[];
}

export interface AtSummary {
  results: AtResult[];
  /** Assertions without a story/AT pair. */
  untagged: number;
  /** Assertions with a story/AT pair. */
  tagged: number;
}

export function collectTests(report: VitestJsonReport): {
  tests: TaggedTest[];
  untagged: number;
} {
  const tests: TaggedTest[] = [];
  let untagged = 0;

  for (const file of report.testResults ?? []) {
    for (const assertion of file.assertionResults ?? []) {
      const tags = assertion.tags ?? [];
      const story = tags.find((tag) => STORY_TAG.test(tag)) ?? null;
      const at = tags.find((tag) => AT_TAG.test(tag)) ?? null;

      if (!story || !at) {
        untagged += 1;
        continue;
      }

      tests.push({
        story,
        at,
        file: file.name,
        line: assertion.location?.line ?? null,
        fullName: assertion.fullName,
        status: assertion.status,
        messages: assertion.failureMessages ?? [],
      });
    }
  }

  return { tests, untagged };
}

function atStatus(tests: TaggedTest[]): AtStatus {
  if (tests.some((test) => test.status === "failed")) return "failed";
  if (
    tests.some(
      (test) =>
        test.status === "skipped" ||
        test.status === "pending" ||
        test.status === "todo",
    )
  ) {
    return "skipped";
  }
  if (tests.length > 0 && tests.every((test) => test.status === "passed"))
    return "passed";
  return "not-run";
}

export function summariseByAt(
  report: VitestJsonReport,
  registry: Registry,
): AtSummary {
  const { tests, untagged } = collectTests(report);
  const byKey = new Map<string, TaggedTest[]>();

  for (const test of tests) {
    const key = `${test.story}/${test.at}`;
    const group = byKey.get(key) ?? [];
    group.push(test);
    byKey.set(key, group);
  }

  const results: AtResult[] = [];

  for (const [key, group] of byKey) {
    const { story, at } = group[0];
    const entry = story ? registry.stories[story] : undefined;
    const acceptanceTest = entry?.ats.find((candidate) => candidate.id === at);

    results.push({
      key,
      story: story as string,
      at: at as string,
      title: acceptanceTest?.title ?? (at as string),
      issue: entry?.issue ?? 0,
      known: Boolean(entry && acceptanceTest),
      status: atStatus(group),
      tests: group,
    });
  }

  results.sort((a, b) =>
    a.story === b.story
      ? a.at.localeCompare(b.at, undefined, { numeric: true })
      : a.story.localeCompare(b.story),
  );

  return { results, untagged, tagged: tests.length };
}

export function issueUrl(repository: string, issue: number): string {
  return `https://github.com/${repository}/issues/${issue}`;
}

const ICON: Record<AtStatus, string> = {
  passed: "✅",
  failed: "❌",
  skipped: "⚠️",
  "not-run": "➖",
};

/** Keep the job summary readable even if the suite grows a lot. */
const MAX_ROWS = 100;

export function formatText(
  summary: AtSummary,
  labels?: Record<string, string>,
): string {
  const lines: string[] = [];
  const failed = summary.results.filter((result) => result.status === "failed");
  const passed = summary.results.filter((result) => result.status === "passed");
  const skipped = summary.results.filter(
    (result) => result.status === "skipped",
  );

  lines.push(
    `Acceptance report: ${summary.results.length} AT(s), ` +
      `${passed.length} passing, ${failed.length} failing` +
      (skipped.length > 0 ? `, ${skipped.length} skipped.` : "."),
  );

  const shown = summary.results.slice(0, MAX_ROWS);
  for (const result of shown) {
    const label = labels?.[result.key];
    lines.push(
      `  ${ICON[result.status]} ${result.key.padEnd(12)} ` +
        `${result.title.padEnd(30)} #${result.issue}` +
        (label ? `  [${label}]` : ""),
    );
    if (result.status === "failed") {
      for (const test of result.tests.filter((t) => t.status === "failed")) {
        const location = test.line ? `${test.file}:${test.line}` : test.file;
        const message = test.messages[0]?.split("\n")[0] ?? "failed";
        lines.push(`      ${location}  ${message}`);
      }
    }
  }

  if (summary.results.length > shown.length) {
    lines.push(`  ... and ${summary.results.length - shown.length} more AT(s)`);
  }

  if (summary.untagged > 0) {
    lines.push(
      `  ${summary.untagged} test(s) without a US/AT tag were ignored.`,
    );
  }

  return lines.join("\n");
}
