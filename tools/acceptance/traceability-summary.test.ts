import { describe, expect, it } from "vitest";

import type { CheckReport } from "./coverage";
import type { Registry } from "./registry";
import {
  formatTraceabilityMarkdown,
  isTraceabilityFailure,
} from "./traceability-summary";
import type { TraceabilityInput } from "./traceability-summary";

const registry: Registry = {
  repository: "owner/repo",
  stories: {
    "US-15": {
      issue: 37,
      title: "Set my location",
      ats: [{ id: "AT-1", title: "City" }],
    },
    "CH-03b": {
      issue: 63,
      title: "Report failures by story/AT",
      ats: [
        { id: "AT-1", title: "Reported failure" },
        { id: "AT-2", title: "Regression" },
      ],
    },
  },
};

const report = (overrides: Partial<CheckReport> = {}): CheckReport => ({
  pairs: [{ story: "US-15", at: "AT-1", file: "file.test.ts", line: 1 }],
  problems: [],
  unknown: [],
  untagged: [],
  uncovered: [],
  manual: [],
  coveredBy: [],
  notStarted: [],
  ...overrides,
});

const input = (overrides: Partial<TraceabilityInput> = {}): TraceabilityInput => ({
  registry,
  report: report(),
  issues: [63],
  requiredStories: ["CH-03b"],
  unknownIssues: [],
  drift: false,
  ...overrides,
});

describe("isTraceabilityFailure", () => {
  it("fails on uncovered ATs, problems, untagged files or drift", () => {
    expect(isTraceabilityFailure(input())).toBe(false);
    expect(
      isTraceabilityFailure(
        input({
          report: report({
            uncovered: [
              {
                key: "CH-03b/AT-1",
                story: "CH-03b",
                issue: 63,
                at: "AT-1",
                title: "Reported failure",
                required: true,
              },
            ],
          }),
        }),
      ),
    ).toBe(true);
  });
});

describe("formatTraceabilityMarkdown", () => {
  it("shows a failed summary with the required ATs and issue links", () => {
    const markdown = formatTraceabilityMarkdown(
      input({
        report: report({
          uncovered: [
            {
              key: "CH-03b/AT-1",
              story: "CH-03b",
              issue: 63,
              at: "AT-1",
              title: "Reported failure",
              required: true,
            },
            {
              key: "CH-03b/AT-2",
              story: "CH-03b",
              issue: 63,
              at: "AT-2",
              title: "Regression",
              required: true,
            },
          ],
        }),
      }),
    );

    expect(markdown).toContain("## Acceptance traceability");
    expect(markdown).toContain("❌ **Failed**");
    expect(markdown).toContain("Required by #63: CH-03b");
    expect(markdown).toContain("### ATs without a test (2)");
    expect(markdown).toContain(
      "| CH-03b | AT-1 — Reported failure | [#63](https://github.com/owner/repo/issues/63) | yes |",
    );
  });

  it("shows a passing summary without the gap sections", () => {
    const markdown = formatTraceabilityMarkdown(input());

    expect(markdown).toContain("✅ **Passed**");
    expect(markdown).not.toContain("ATs without a test");
    expect(markdown).not.toContain("### Problems");
  });

  it("lists problems, untagged files and a stale registry", () => {
    const markdown = formatTraceabilityMarkdown(
      input({
        report: report({
          problems: [
            {
              file: "tests/acceptance/x.test.ts",
              line: 12,
              message: "expected exactly one story tag and one AT tag",
            },
          ],
          untagged: ["tests/acceptance/y.test.ts"],
        }),
        drift: true,
      }),
    );

    expect(markdown).toContain("### Problems (1)");
    expect(markdown).toContain("`tests/acceptance/x.test.ts:12`");
    expect(markdown).toContain("### Acceptance test files without US/AT tags (1)");
    expect(markdown).toContain("`tests/acceptance/y.test.ts`");
    expect(markdown).toContain("Run `npm run acceptance:sync`");
  });

  it("treats drift as advisory when the run does not own the tests", () => {
    const markdown = formatTraceabilityMarkdown(
      input({ drift: true, driftIsFatal: false }),
    );

    expect(markdown).toContain("✅ **Passed**");
    expect(markdown).toContain("### Registry (advisory)");
    expect(markdown).toContain("This run does not touch `tests/`, so it does not fail.");
  });

  it("says when there is no linked issue", () => {
    const markdown = formatTraceabilityMarkdown(
      input({ issues: [], requiredStories: [] }),
    );

    expect(markdown).toContain("No linked issue: the per-issue rule was skipped.");
  });

  it("collapses the stories that have not started", () => {
    const markdown = formatTraceabilityMarkdown(
      input({ report: report({ notStarted: ["US-99"] }) }),
    );

    expect(markdown).toContain(
      "<details><summary>1 story not started yet</summary>",
    );
    expect(markdown).toContain("US-99");
  });
});
