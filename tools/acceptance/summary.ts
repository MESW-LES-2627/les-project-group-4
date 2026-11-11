// Builds the collapsible "by story" job summary.
//
// Every story in the registry gets a <details> block, including the ones with
// no tests yet, so the summary shows the whole board rather than only the
// stories that happened to run. Failing stories are open and first.

import { relative } from "node:path";

import type { Overrides } from "./coverage";
import { issueUrl } from "./report";
import type { AtResult, AtStatus, AtSummary } from "./report";
import type { Registry } from "./registry";

export type AtRowStatus =
  AtStatus | "manual" | "deferred" | "covered-by" | "not-run";

export interface AtRow {
  id: string;
  title: string;
  status: AtRowStatus;
  coveredBy?: string;
  tests: number | null;
  failures: Array<{
    file: string;
    line: number | null;
    message: string;
  }>;
}

export type StoryStatus =
  "failed" | "skipped" | "passed" | "manual" | "not-started";

export interface StoryRow {
  key: string;
  title: string;
  issue: number;
  status: StoryStatus;
  ats: AtRow[];
  passed: number;
  failed: number;
  manual: number;
  notRun: number;
}

export interface GroupedReport {
  stories: StoryRow[];
  unknown: AtResult[];
}

const STORY_ICON: Record<StoryStatus, string> = {
  failed: "❌",
  skipped: "⚠️",
  passed: "✅",
  manual: "⚪",
  "not-started": "⬜",
};

const AT_ICON: Record<AtRowStatus, string> = {
  passed: "✅",
  failed: "❌",
  skipped: "⚠️",
  manual: "⚪",
  deferred: "⏸️",
  "covered-by": "🔗",
  "not-run": "⬜",
};

const AT_LABEL: Record<AtRowStatus, string> = {
  passed: "passed",
  failed: "failed",
  skipped: "skipped",
  manual: "manual",
  deferred: "deferred",
  "covered-by": "covered by",
  "not-run": "not run",
};

export function buildGroupedReport(
  summary: AtSummary,
  registry: Registry,
  overrides: Overrides = {},
): GroupedReport {
  const byKey = new Map(summary.results.map((result) => [result.key, result]));
  const stories: StoryRow[] = [];

  for (const [key, story] of Object.entries(registry.stories)) {
    const ats: AtRow[] = story.ats.map((at) => {
      const result = byKey.get(`${key}/${at.id}`);
      if (result) {
        return {
          id: at.id,
          title: at.title,
          status: result.status,
          tests: result.tests.length,
          failures: result.tests
            .filter((test) => test.status === "failed")
            .map((test) => ({
              file: relative(process.cwd(), test.file),
              line: test.line,
              message: (test.messages[0] ?? "failed").split("\n")[0],
            })),
        };
      }

      const override = overrides[`${key}/${at.id}`];
      if (override) {
        return {
          id: at.id,
          title: at.title,
          status: override.status,
          coveredBy: override.by,
          tests: null,
          failures: [],
        };
      }

      return {
        id: at.id,
        title: at.title,
        status: "not-run",
        tests: null,
        failures: [],
      };
    });

    const failed = ats.filter((at) => at.status === "failed").length;
    const passed = ats.filter((at) => at.status === "passed").length;
    const skipped = ats.filter((at) => at.status === "skipped").length;
    const ran = ats.filter(
      (at) =>
        at.status === "passed" ||
        at.status === "failed" ||
        at.status === "skipped",
    ).length;
    const manual = ats.filter(
      (at) =>
        at.status === "manual" ||
        at.status === "deferred" ||
        at.status === "covered-by",
    ).length;
    const notRun = ats.filter((at) => at.status === "not-run").length;

    const status: StoryStatus =
      failed > 0
        ? "failed"
        : ran === 0
          ? manual > 0
            ? "manual"
            : "not-started"
          : skipped > 0
            ? "skipped"
            : "passed";

    stories.push({
      key,
      title: story.title,
      issue: story.issue,
      status,
      ats,
      passed,
      failed,
      manual,
      notRun,
    });
  }

  // Failing stories first, then the registry order.
  const ordered = [
    ...stories.filter((story) => story.status === "failed"),
    ...stories.filter((story) => story.status !== "failed"),
  ];

  const unknown = summary.results.filter((result) => {
    const story = registry.stories[result.story];
    return !story || !story.ats.some((at) => at.id === result.at);
  });

  return { stories: ordered, unknown };
}

export function formatGroupedMarkdown(
  report: GroupedReport,
  repository: string,
  labels?: Record<string, string>,
): string {
  const lines: string[] = [];
  const withTests = report.stories.filter(
    (story) => story.passed + story.failed > 0,
  );
  const failing = report.stories.filter((story) => story.status === "failed");

  lines.push("## Acceptance tests by story");
  lines.push("");
  lines.push(
    `**${report.stories.length} stories** · ${withTests.length} with tests · ` +
      `${failing.length} failing`,
  );

  for (const story of report.stories) {
    const extras: string[] = [];
    if (story.failed > 0) extras.push(`${story.failed} failed`);
    if (story.manual > 0) extras.push(`${story.manual} manual`);
    if (story.notRun > 0 && story.notRun < story.ats.length) {
      extras.push(`${story.notRun} not run`);
    }

    lines.push("");
    lines.push(`<details${story.status === "failed" ? " open" : ""}>`);
    lines.push(
      `<summary>${STORY_ICON[story.status]} ${story.key} — ${cell(story.title)} ` +
        `([#${story.issue}](${issueUrl(repository, story.issue)})) · ` +
        `${story.passed}/${story.ats.length} ATs` +
        (extras.length > 0 ? ` · ${extras.join(" · ")}` : "") +
        `</summary>`,
    );
    lines.push("");
    lines.push(
      labels ? "| AT | Result | Change | Tests |" : "| AT | Result | Tests |",
    );
    lines.push(labels ? "| --- | --- | --- | --- |" : "| --- | --- | --- |");

    for (const at of story.ats) {
      const result =
        at.status === "covered-by"
          ? `${AT_ICON[at.status]} ${AT_LABEL[at.status]} ${at.coveredBy ?? ""}`
          : `${AT_ICON[at.status]} ${AT_LABEL[at.status]}`;
      const tests = at.tests === null ? "—" : String(at.tests);
      const change = labels
        ? ` ${labels[`${story.key}/${at.id}`] ?? ""} |`
        : "";

      lines.push(
        `| ${at.id} — ${cell(at.title)} | ${result} |${change} ${tests} |`,
      );
    }

    for (const at of story.ats) {
      for (const failure of at.failures) {
        const location = failure.line
          ? `${failure.file}:${failure.line}`
          : failure.file;
        lines.push("");
        lines.push(`**${at.id} — ${cell(at.title)}** · \`${location}\``);
        lines.push("");
        lines.push(`\`${cell(failure.message)}\``);
      }
    }

    lines.push("");
    lines.push("</details>");
  }

  if (report.unknown.length > 0) {
    lines.push("");
    lines.push("<details open>");
    lines.push(`<summary>⚠️ Unknown tags (${report.unknown.length})</summary>`);
    lines.push("");
    lines.push("| Key | Result | Tests |");
    lines.push("| --- | --- | --- |");

    for (const result of report.unknown) {
      lines.push(
        `| ${result.key} | ${AT_ICON[result.status]} ${AT_LABEL[result.status]} | ` +
          `${result.tests.length} |`,
      );
    }

    lines.push("");
    lines.push("</details>");
  }

  return lines.join("\n");
}

function cell(value: string): string {
  return value.replace(/\|/g, "\\|");
}
