// Builds the collapsible "by story" job summary.
//
// Only stories that have been started are shown: at least one AT has a result
// or an override. The rest are listed on one line at the bottom. User stories
// come first, chores after, and failing stories are open and first in each
// section.

import { relative, sep } from "node:path";

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
  /** Stories with every AT still "not run" and no override. */
  notStarted: string[];
  unknown: AtResult[];
}

export interface SummaryOptions {
  labels?: Record<string, string>;
  /** Compact line such as "32 passed · 1 failed · 1 regression". */
  stats?: string;
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

const TITLE_LIMIT = 60;

export function buildGroupedReport(
  summary: AtSummary,
  registry: Registry,
  overrides: Overrides = {},
): GroupedReport {
  const byKey = new Map(summary.results.map((result) => [result.key, result]));
  const stories: StoryRow[] = [];
  const notStarted: string[] = [];

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
              // Separators are normalised to `/` so the report is the same on Windows.
              file: relative(process.cwd(), test.file).split(sep).join("/"),
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

    if (ats.every((at) => at.status === "not-run")) {
      notStarted.push(key);
      continue;
    }

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
          ? "manual"
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

  // Failing stories first, then by key; the US/CH split happens in the
  // formatter, so this order is preserved inside each section.
  stories.sort((a, b) => {
    const byStatus =
      Number(b.status === "failed") - Number(a.status === "failed");
    return byStatus !== 0
      ? byStatus
      : a.key.localeCompare(b.key, undefined, { numeric: true });
  });
  notStarted.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const unknown = summary.results.filter((result) => {
    const story = registry.stories[result.story];
    return !story || !story.ats.some((at) => at.id === result.at);
  });

  return { stories, notStarted, unknown };
}

export function formatGroupedMarkdown(
  report: GroupedReport,
  repository: string,
  options: SummaryOptions = {},
): string {
  const lines: string[] = [];
  const userStories = report.stories.filter(
    (story) => !story.key.startsWith("CH-"),
  );
  const chores = report.stories.filter((story) => story.key.startsWith("CH-"));

  lines.push("## Acceptance tests by story");
  if (options.stats) {
    lines.push("");
    lines.push(options.stats);
  }

  if (userStories.length > 0) {
    lines.push("");
    lines.push(`### User stories (${userStories.length})`);
    lines.push(...renderStories(userStories, repository, options.labels));
  }

  if (chores.length > 0) {
    lines.push("");
    lines.push(`### Chores (${chores.length})`);
    lines.push(...renderStories(chores, repository, options.labels));
  }

  if (report.notStarted.length > 0) {
    lines.push("");
    lines.push(
      `${report.notStarted.length} ` +
        `${report.notStarted.length === 1 ? "story" : "stories"} not started yet ` +
        `(not shown): ${report.notStarted.join(", ")}`,
    );
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

function renderStories(
  stories: StoryRow[],
  repository: string,
  labels?: Record<string, string>,
): string[] {
  const lines: string[] = [];

  for (const story of stories) {
    const extras: string[] = [];
    if (story.failed > 0) extras.push(`${story.failed} failed`);
    if (story.manual > 0) extras.push(`${story.manual} manual`);
    if (story.notRun > 0) extras.push(`${story.notRun} not run`);

    const link = `<a href="${issueUrl(repository, story.issue)}">#${story.issue}</a>`;

    lines.push("");
    lines.push(`<details${story.status === "failed" ? " open" : ""}>`);
    lines.push(
      `<summary>${STORY_ICON[story.status]} ${story.key} · ` +
        `${escapeHtml(truncate(story.title, TITLE_LIMIT))} · ${link} · ` +
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

  return lines;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cell(value: string): string {
  return value.replace(/\|/g, "\\|");
}
