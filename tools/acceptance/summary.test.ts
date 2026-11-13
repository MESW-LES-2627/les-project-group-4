import { describe, expect, it } from "vitest";

import type { Overrides } from "./coverage";
import type { AtResult, AtStatus, AtSummary } from "./report";
import type { Registry } from "./registry";
import { buildGroupedReport, formatGroupedMarkdown } from "./summary";

const registry: Registry = {
  repository: "owner/repo",
  stories: {
    "US-01": {
      issue: 23,
      title: "Create a room",
      ats: [{ id: "AT-1", title: "Create" }],
    },
    "US-02": {
      issue: 24,
      title: "List my rooms",
      ats: [
        { id: "AT-1", title: "List" },
        { id: "AT-2", title: "Empty" },
      ],
    },
    "US-15": {
      issue: 37,
      title: "Set my location",
      ats: [
        { id: "AT-1", title: "City" },
        { id: "AT-2", title: "Geolocation" },
        { id: "AT-3", title: "Permission denied" },
      ],
    },
    "US-04": {
      issue: 26,
      title: "Edit a room",
      ats: [{ id: "AT-1", title: "Edit" }],
    },
    "CH-01": {
      issue: 41,
      title: "Set up staging and production deployment",
      ats: [
        { id: "AT-1", title: "Staging deploy" },
        { id: "AT-2", title: "Production deploy" },
      ],
    },
  },
};

const result = (
  key: string,
  status: AtStatus,
  tests = 1,
  message?: string,
): AtResult => {
  const [story, at] = key.split("/");
  return {
    key,
    story,
    at,
    title: at,
    issue: 1,
    known: true,
    status,
    tests: Array.from({ length: tests }, (_, index) => ({
      story,
      at,
      file: `tests/acceptance/${story}/${at}.test.ts`,
      line: 12,
      fullName: `test ${index}`,
      status: status === "failed" ? "failed" : "passed",
      messages: message ? [message] : [],
    })),
  };
};

const summary = (results: AtResult[]): AtSummary => ({
  results,
  untagged: 0,
  tagged: results.length,
});

const overrides: Overrides = {
  "US-02/AT-1": { status: "manual", note: "no component harness" },
  "US-02/AT-2": { status: "covered-by", by: "US-01" },
};

const report = () =>
  buildGroupedReport(
    summary([
      result("US-15/AT-1", "passed", 19),
      result("US-15/AT-3", "failed", 2, "expected the denied message"),
      result("US-01/AT-1", "passed", 2),
      result("CH-01/AT-1", "passed", 5),
    ]),
    registry,
    overrides,
  );

describe("buildGroupedReport", () => {
  it("shows started and overridden stories only", () => {
    expect(report().stories.map((story) => story.key)).toEqual([
      "US-15",
      "CH-01",
      "US-01",
      "US-02",
    ]);
  });

  it("lists the stories with no results and no override separately", () => {
    expect(report().notStarted).toEqual(["US-04"]);
  });

  it("puts the failing story first and marks it failed", () => {
    const failing = report().stories[0];

    expect(failing.key).toBe("US-15");
    expect(failing.status).toBe("failed");
    expect(failing.failed).toBe(1);
    expect(failing.passed).toBe(1);
  });

  it("maps manual and covered-by overrides to their own status", () => {
    const story = report().stories.find((s) => s.key === "US-02");

    expect(story?.status).toBe("manual");
    expect(story?.ats.map((at) => at.status)).toEqual(["manual", "covered-by"]);
    expect(story?.ats[1].coveredBy).toBe("US-01");
  });

  it("keeps failure details with a file and line", () => {
    const failedAt = report().stories[0].ats.find((at) => at.id === "AT-3");

    expect(failedAt?.failures[0]).toEqual({
      file: "tests/acceptance/US-15/AT-3.test.ts",
      line: 12,
      message: "expected the denied message",
    });
  });
});

describe("formatGroupedMarkdown", () => {
  it("puts user stories before chores", () => {
    const markdown = formatGroupedMarkdown(report(), registry.repository);

    expect(markdown.indexOf("### User stories (3)")).toBeGreaterThan(-1);
    expect(markdown.indexOf("### Chores (1)")).toBeGreaterThan(
      markdown.indexOf("### User stories (3)"),
    );
  });

  it("puts the failing story first inside the user stories section", () => {
    const markdown = formatGroupedMarkdown(report(), registry.repository);

    expect(markdown.indexOf("❌ US-15")).toBeLessThan(
      markdown.indexOf("✅ US-01"),
    );
    expect(markdown).toContain("<details open>");
  });

  it("renders the issue link as an anchor, since Markdown is not parsed in <summary>", () => {
    const markdown = formatGroupedMarkdown(report(), registry.repository);

    expect(markdown).toContain(
      '<a href="https://github.com/owner/repo/issues/37">#37</a>',
    );
    expect(markdown).not.toContain("[#37](");
  });

  it("shows the AT counts and the test count", () => {
    const markdown = formatGroupedMarkdown(report(), registry.repository);

    expect(markdown).toContain("❌ US-15 · Set my location ·");
    expect(markdown).toContain("· 1/3 ATs · 1 failed");
    expect(markdown).toContain("| AT-1 — City | ✅ passed | 19 |");
  });

  it("labels manual, covered-by and not-run ATs", () => {
    const markdown = formatGroupedMarkdown(report(), registry.repository);

    expect(markdown).toContain("| AT-1 — List | ⚪ manual | — |");
    expect(markdown).toContain("| AT-2 — Empty | 🔗 covered by US-01 | — |");
    expect(markdown).toContain("| AT-2 — Geolocation | ⬜ not run | — |");
  });

  it("prints the failing location and message inside the story block", () => {
    const markdown = formatGroupedMarkdown(report(), registry.repository);

    expect(markdown).toContain(
      "**AT-3 — Permission denied** · `tests/acceptance/US-15/AT-3.test.ts:12`",
    );
    expect(markdown).toContain("`expected the denied message`");
  });

  it("adds the Change column when labels are given", () => {
    const markdown = formatGroupedMarkdown(report(), registry.repository, {
      labels: { "US-15/AT-3": "regression" },
    });

    expect(markdown).toContain("| AT | Result | Change | Tests |");
    expect(markdown).toContain("❌ failed | regression | 2 |");
  });

  it("puts the stats line under the heading", () => {
    const markdown = formatGroupedMarkdown(report(), registry.repository, {
      stats: "4 passed · 1 failed · 1 regression",
    });

    expect(markdown).toContain(
      "## Acceptance tests by story\n\n4 passed · 1 failed · 1 regression\n",
    );
  });

  it("lists the stories not started on one line", () => {
    const markdown = formatGroupedMarkdown(report(), registry.repository);

    expect(markdown).toContain("1 story not started yet (not shown): US-04");
  });

  it("truncates a long story title", () => {
    const long: Registry = {
      repository: "owner/repo",
      stories: {
        "US-99": {
          issue: 99,
          title:
            "A very long story title that will definitely need to be truncated in the summary line",
          ats: [{ id: "AT-1", title: "One" }],
        },
      },
    };
    const markdown = formatGroupedMarkdown(
      buildGroupedReport(summary([result("US-99/AT-1", "passed")]), long),
      long.repository,
    );

    expect(markdown).toContain("…");
    expect(markdown).not.toContain("summary line");
  });

  it("puts unknown tags in their own group at the end", () => {
    const withUnknown = buildGroupedReport(
      summary([result("US-99/AT-1", "failed")]),
      registry,
    );
    const markdown = formatGroupedMarkdown(withUnknown, registry.repository);

    expect(markdown).toContain("<summary>⚠️ Unknown tags (1)</summary>");
    expect(markdown).toContain("| US-99/AT-1 | ❌ failed | 1 |");
  });
});
