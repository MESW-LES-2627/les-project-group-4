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
    ]),
    registry,
    overrides,
  );

describe("buildGroupedReport", () => {
  it("includes every story in the registry, even without tests", () => {
    expect(report().stories.map((story) => story.key)).toEqual([
      "US-15",
      "US-01",
      "US-02",
      "US-04",
    ]);
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

  it("marks a story with no tests and no overrides as not started", () => {
    const story = report().stories.find((s) => s.key === "US-04");

    expect(story?.status).toBe("not-started");
    expect(story?.ats[0].status).toBe("not-run");
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
  it("opens failing stories and collapses the rest", () => {
    const markdown = formatGroupedMarkdown(report(), registry.repository);

    expect(markdown).toContain("<details open>");
    expect(markdown).toContain("❌ US-15 — Set my location");
    expect(markdown.match(/<details>/g)?.length).toBe(3);
  });

  it("shows the issue link, the AT counts and the test count", () => {
    const markdown = formatGroupedMarkdown(report(), registry.repository);

    expect(markdown).toContain("([#37](https://github.com/owner/repo/issues/37))");
    expect(markdown).toContain("· 1/3 ATs · 1 failed");
    expect(markdown).toContain("| AT-1 — City | ✅ passed | 19 |");
  });

  it("labels manual, covered-by and not-run ATs", () => {
    const markdown = formatGroupedMarkdown(report(), registry.repository);

    expect(markdown).toContain("| AT-1 — List | ⚪ manual | — |");
    expect(markdown).toContain("| AT-2 — Empty | 🔗 covered by US-01 | — |");
    expect(markdown).toContain("| AT-1 — Edit | ⬜ not run | — |");
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
      "US-15/AT-3": "regression",
    });

    expect(markdown).toContain("| AT | Result | Change | Tests |");
    expect(markdown).toContain("❌ failed | regression | 2 |");
  });

  it("shows the top-level counts", () => {
    expect(formatGroupedMarkdown(report(), registry.repository)).toContain(
      "**4 stories** · 2 with tests · 1 failing",
    );
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
