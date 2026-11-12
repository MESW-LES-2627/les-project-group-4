// Markdown for the traceability job summary. Written even when the check
// fails, so the job page shows the gaps without opening the raw log.

import type { CheckReport } from "./coverage";
import { issueUrl } from "./report";
import type { Registry } from "./registry";

export interface TraceabilityInput {
  registry: Registry;
  report: CheckReport;
  issues: number[];
  requiredStories: string[];
  unknownIssues: number[];
  drift: boolean;
  /** False when CI decided this run cannot be blamed for a stale registry. */
  driftIsFatal?: boolean;
}

const MAX_ROWS = 50;

export function isTraceabilityFailure(input: TraceabilityInput): boolean {
  return (
    input.report.problems.length > 0 ||
    input.report.untagged.length > 0 ||
    input.report.uncovered.length > 0 ||
    (input.drift && input.driftIsFatal !== false)
  );
}

export function formatTraceabilityMarkdown(input: TraceabilityInput): string {
  const { registry, report } = input;
  const lines: string[] = [];
  const failed = isTraceabilityFailure(input);

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

  lines.push("## Acceptance traceability");
  lines.push("");
  lines.push(
    `${failed ? "❌ **Failed**" : "✅ **Passed**"} · ` +
      `**${coveredAts}/${totalAts} ATs covered** · ` +
      `${report.manual.length} manual/deferred · ` +
      `${report.coveredBy.length} covered by another story · ` +
      `${report.pairs.length} tagged groups`,
  );

  if (input.requiredStories.length > 0) {
    lines.push("");
    lines.push(
      `Required by ${input.issues.map((issue) => `#${issue}`).join(", ")}: ` +
        input.requiredStories.join(", "),
    );
  } else if (input.issues.length === 0) {
    lines.push("");
    lines.push("No linked issue: the per-issue rule was skipped.");
  }

  if (input.unknownIssues.length > 0) {
    lines.push("");
    lines.push(
      `Not stories in the registry: ${input.unknownIssues
        .map((issue) => `#${issue}`)
        .join(", ")}.`,
    );
  }

  if (report.uncovered.length > 0) {
    lines.push("");
    lines.push(`### ATs without a test (${report.uncovered.length})`);
    lines.push("");
    lines.push("| Story | AT | Issue | Required |");
    lines.push("| --- | --- | --- | --- |");

    for (const at of report.uncovered.slice(0, MAX_ROWS)) {
      const issue =
        at.issue > 0
          ? `[#${at.issue}](${issueUrl(registry.repository, at.issue)})`
          : "unknown";
      lines.push(
        `| ${at.story} | ${at.at} — ${cell(at.title)} | ${issue} | ` +
          `${at.required ? "yes" : ""} |`,
      );
    }

    if (report.uncovered.length > MAX_ROWS) {
      lines.push("");
      lines.push(`... and ${report.uncovered.length - MAX_ROWS} more.`);
    }
  }

  if (report.problems.length > 0) {
    lines.push("");
    lines.push(`### Problems (${report.problems.length})`);
    lines.push("");
    for (const problem of report.problems.slice(0, MAX_ROWS)) {
      const location =
        problem.line > 0
          ? `\`${problem.file}:${problem.line}\``
          : `\`${problem.file}\``;
      lines.push(`- ${location} — ${problem.message}`);
    }
    if (report.problems.length > MAX_ROWS) {
      lines.push(`- ... and ${report.problems.length - MAX_ROWS} more.`);
    }
  }

  if (report.untagged.length > 0) {
    lines.push("");
    lines.push(
      `### Acceptance test files without US/AT tags (${report.untagged.length})`,
    );
    lines.push("");
    for (const file of report.untagged.slice(0, MAX_ROWS)) {
      lines.push(`- \`${file}\``);
    }
    if (report.untagged.length > MAX_ROWS) {
      lines.push(`- ... and ${report.untagged.length - MAX_ROWS} more.`);
    }
  }

  if (input.drift) {
    lines.push("");
    lines.push(
      input.driftIsFatal === false
        ? "### Registry (advisory)"
        : "### Registry",
    );
    lines.push("");
    lines.push(
      "`tests/registry.json` is out of date. Run `npm run acceptance:sync` and commit the result." +
        (input.driftIsFatal === false
          ? " This run does not touch `tests/`, so it does not fail."
          : ""),
    );
  }

  if (report.notStarted.length > 0) {
    lines.push("");
    lines.push(
      `<details><summary>${report.notStarted.length} ` +
        `${report.notStarted.length === 1 ? "story" : "stories"} not started yet</summary>`,
    );
    lines.push("");
    lines.push(report.notStarted.join(", "));
    lines.push("");
    lines.push("</details>");
  }

  return lines.join("\n");
}

function cell(value: string): string {
  return value.replace(/\|/g, "\\|");
}
