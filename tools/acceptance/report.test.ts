import { describe, expect, it } from "vitest";

import {
  collectTests,
  formatMarkdown,
  formatText,
  issueUrl,
  summariseByAt,
} from "./report";
import type { Registry } from "./registry";
import type { VitestJsonReport } from "./report";

const registry: Registry = {
  repository: "owner/repo",
  stories: {
    "US-15": {
      issue: 37,
      title: "Set my location",
      ats: [
        { id: "AT-1", title: "City" },
        { id: "AT-2", title: "Geolocation" },
      ],
    },
    "US-06a": {
      issue: 43,
      title: "Plan2D renderer",
      ats: [{ id: "AT-1", title: "Plan outline" }],
    },
  },
};

const assertion = (
  fullName: string,
  status: string,
  tags: string[],
  extra: Record<string, unknown> = {},
) => ({
  fullName,
  status,
  tags,
  failureMessages: status === "failed" ? ["expected 1 to be 2"] : [],
  location: { line: 12, column: 3 },
  ...extra,
});

describe("collectTests", () => {
  it("reads the story, AT, file, line and failure messages from the report", () => {
    const report: VitestJsonReport = {
      testResults: [
        {
          name: "tests/acceptance/US-15/AT-1-city.test.ts",
          assertionResults: [
            assertion("shows Porto", "passed", ["acceptance", "US-15", "AT-1"]),
            assertion("rejects an unknown city", "failed", ["acceptance", "US-15", "AT-1"]),
            assertion("no tag here", "passed", ["acceptance"]),
          ],
        },
      ],
    };

    const { tests, untagged } = collectTests(report);

    expect(tests).toHaveLength(2);
    expect(tests[0]).toMatchObject({
      story: "US-15",
      at: "AT-1",
      file: "tests/acceptance/US-15/AT-1-city.test.ts",
      line: 12,
    });
    expect(tests[1].messages).toEqual(["expected 1 to be 2"]);
    expect(untagged).toBe(1);
  });

  it("handles a missing testResults array", () => {
    expect(collectTests({})).toEqual({ tests: [], untagged: 0 });
  });
});

describe("summariseByAt", () => {
  const report = (assertions: ReturnType<typeof assertion>[]): VitestJsonReport => ({
    testResults: [
      { name: "file.test.ts", assertionResults: assertions },
    ],
  });

  it("joins the tags with the registry for the title and issue", () => {
    const summary = summariseByAt(
      report([assertion("shows Porto", "passed", ["US-15", "AT-1"])]),
      registry,
    );

    expect(summary.results).toEqual([
      {
        key: "US-15/AT-1",
        story: "US-15",
        at: "AT-1",
        title: "City",
        issue: 37,
        known: true,
        status: "passed",
        tests: [expect.objectContaining({ fullName: "shows Porto" })],
      },
    ]);
    expect(summary.tagged).toBe(1);
  });

  it("marks the AT failed when any of its tests fails", () => {
    const summary = summariseByAt(
      report([
        assertion("first", "passed", ["US-15", "AT-1"]),
        assertion("second", "failed", ["US-15", "AT-1"]),
      ]),
      registry,
    );

    expect(summary.results[0].status).toBe("failed");
  });

  it("marks the AT skipped when a test was skipped and none failed", () => {
    const summary = summariseByAt(
      report([
        assertion("first", "passed", ["US-15", "AT-1"]),
        assertion("second", "skipped", ["US-15", "AT-1"]),
      ]),
      registry,
    );

    expect(summary.results[0].status).toBe("skipped");
  });

  it("flags a tag that is not in the registry instead of dropping the result", () => {
    const summary = summariseByAt(
      report([assertion("x", "passed", ["US-99", "AT-1"])]),
      registry,
    );

    expect(summary.results[0]).toMatchObject({ known: false, issue: 0, title: "AT-1" });
  });

  it("sorts by story, then AT number", () => {
    const summary = summariseByAt(
      report([
        assertion("a", "passed", ["US-15", "AT-2"]),
        assertion("b", "passed", ["US-06a", "AT-1"]),
        assertion("c", "passed", ["US-15", "AT-1"]),
      ]),
      registry,
    );

    expect(summary.results.map((result) => result.key)).toEqual([
      "US-06a/AT-1",
      "US-15/AT-1",
      "US-15/AT-2",
    ]);
  });
});

describe("formatText", () => {
  it("lists the ATs and points at the failing line", () => {
    const summary = summariseByAt(
      {
        testResults: [
          {
            name: "tests/acceptance/US-15/AT-2-geolocation.test.ts",
            assertionResults: [
              assertion("stores coordinates", "failed", ["US-15", "AT-2"]),
            ],
          },
        ],
      },
      registry,
    );

    const text = formatText(summary);

    expect(text).toContain("1 AT(s), 0 passing, 1 failing");
    expect(text).toContain("US-15/AT-2");
    expect(text).toContain("Geolocation");
    expect(text).toContain("tests/acceptance/US-15/AT-2-geolocation.test.ts:12");
    expect(text).toContain("expected 1 to be 2");
  });

  it("mentions untagged tests that were ignored", () => {
    const summary = summariseByAt(
      { testResults: [{ name: "x", assertionResults: [assertion("x", "passed", [])] }] },
      registry,
    );

    expect(formatText(summary)).toContain("1 test(s) without a US/AT tag");
  });
});

describe("formatMarkdown", () => {
  it("writes a table with a link to the issue", () => {
    const summary = summariseByAt(
      {
        testResults: [
          {
            name: "file.test.ts",
            assertionResults: [assertion("x", "passed", ["US-15", "AT-1"])],
          },
        ],
      },
      registry,
    );

    const markdown = formatMarkdown(summary, registry.repository);

    expect(markdown).toContain("| US-15 | AT-1 — City | ✅ passed |");
    expect(markdown).toContain("[#37](https://github.com/owner/repo/issues/37)");
    expect(markdown).toContain("1 AT(s) in the report, 0 failing.");
  });
});

describe("issueUrl", () => {
  it("builds the GitHub issue URL", () => {
    expect(issueUrl("owner/repo", 37)).toBe(
      "https://github.com/owner/repo/issues/37",
    );
  });
});
