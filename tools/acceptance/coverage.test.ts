import { describe, expect, it } from "vitest";

import { checkCoverage, scanTags } from "./coverage";
import type { Overrides } from "./coverage";
import type { Registry } from "./registry";

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
    "CH-02": {
      issue: 42,
      title: "Seed items, stores and cities",
      ats: [{ id: "AT-1", title: "Idempotent seed" }],
    },
  },
};

describe("scanTags", () => {
  it("reads one story tag and one AT tag from a test", () => {
    const source = `it('stores Porto', { tags: ['acceptance', 'US-15', 'AT-1'] }, () => {})`;

    expect(scanTags("AT-1-city.test.ts", source)).toEqual({
      pairs: [
        { story: "US-15", at: "AT-1", file: "AT-1-city.test.ts", line: 1 },
      ],
      problems: [],
    });
  });

  it("handles a tags array spread over several lines", () => {
    const source = [
      "it('stores Porto', {",
      "  tags: [",
      "    'acceptance',",
      "    'US-15',",
      "    'AT-1',",
      "  ],",
      "}, () => {})",
    ].join("\n");

    expect(scanTags("file.test.ts", source).pairs).toEqual([
      { story: "US-15", at: "AT-1", file: "file.test.ts", line: 2 },
    ]);
  });

  it("accepts a chore key such as CH-02", () => {
    const source = `it('seeds twice', { tags: ['acceptance', 'CH-02', 'AT-1'] }, () => {})`;

    expect(scanTags("file.test.ts", source).pairs[0]?.story).toBe("CH-02");
  });

  it("ignores tag arrays with no story or AT tag", () => {
    const source = `it('is fast', { tags: ['acceptance', 'slow'] }, () => {})`;

    expect(scanTags("file.test.ts", source)).toEqual({
      pairs: [],
      problems: [],
    });
  });

  it("reports a story tag without an AT tag", () => {
    const source = `it('x', { tags: ['acceptance', 'US-15'] }, () => {})`;
    const { pairs, problems } = scanTags("file.test.ts", source);

    expect(pairs).toEqual([]);
    expect(problems).toHaveLength(1);
    expect(problems[0].message).toMatch(/exactly one story tag and one AT tag/);
  });

  it("reports two AT tags in one array instead of guessing", () => {
    const source = `it('x', { tags: ['US-15', 'AT-1', 'AT-2'] }, () => {})`;

    expect(scanTags("file.test.ts", source).problems[0]?.message).toMatch(
      /AT-1, AT-2/,
    );
  });
});

describe("checkCoverage", () => {
  const tagged = (story: string, at: string) => ({
    file: `${story}-${at}.test.ts`,
    source: `it('x', { tags: ['acceptance', '${story}', '${at}'] }, () => {})`,
  });

  it("reports only the started story's ATs that have neither a test nor an override", () => {
    const report = checkCoverage(registry, [tagged("US-15", "AT-1")], {});

    expect(report.pairs).toHaveLength(1);
    expect(report.uncovered.map((at) => at.key)).toEqual(["US-15/AT-2"]);
    expect(report.manual).toEqual([]);
    expect(report.notStarted).toEqual(["CH-02"]);
  });

  it("ignores the ATs of stories with no tests and no overrides", () => {
    const report = checkCoverage(registry, [], {});

    expect(report.uncovered).toEqual([]);
    expect(report.notStarted).toEqual(["CH-02", "US-15"]);
  });

  it("reports acceptance files with no US/AT tags", () => {
    const report = checkCoverage(
      registry,
      [
        {
          file: "tests/acceptance/US-15/no-tags.test.ts",
          source: "it('x', () => {})",
        },
        {
          file: "tests/acceptance/US-15/only-acceptance.test.ts",
          source: "it('x', { tags: ['acceptance'] }, () => {})",
        },
      ],
      {},
    );

    expect(report.untagged).toEqual([
      "tests/acceptance/US-15/no-tags.test.ts",
      "tests/acceptance/US-15/only-acceptance.test.ts",
    ]);
  });

  it("does not report a file with a malformed tag as untagged", () => {
    const report = checkCoverage(
      registry,
      [
        {
          file: "bad.test.ts",
          source: "it('x', { tags: ['US-15'] }, () => {})",
        },
      ],
      {},
    );

    expect(report.problems).toHaveLength(1);
    expect(report.untagged).toEqual([]);
  });

  it("counts a story as started once it has an override", () => {
    const report = checkCoverage(registry, [], {
      "US-15/AT-1": { status: "manual" },
    });

    expect(report.notStarted).toEqual(["CH-02"]);
    expect(report.uncovered.map((at) => at.key)).toEqual(["US-15/AT-2"]);
  });

  it("takes manual and deferred overrides out of the uncovered list", () => {
    const overrides: Overrides = {
      "US-15/AT-2": { status: "manual", note: "no component harness" },
      "CH-02/AT-1": { status: "deferred", note: "tracked in #64" },
    };
    const report = checkCoverage(
      registry,
      [tagged("US-15", "AT-1")],
      overrides,
    );

    expect(report.uncovered).toEqual([]);
    expect(report.manual).toEqual(["CH-02/AT-1", "US-15/AT-2"]);
  });

  it("takes covered-by overrides out of the uncovered list", () => {
    const report = checkCoverage(
      registry,
      [tagged("US-15", "AT-1"), tagged("CH-02", "AT-1")],
      { "US-15/AT-2": { status: "covered-by", by: "CH-02" } },
    );

    expect(report.uncovered).toEqual([]);
    expect(report.manual).toEqual([]);
    expect(report.coveredBy).toEqual(["US-15/AT-2"]);
  });

  it("flags a covered-by override with no target story", () => {
    const report = checkCoverage(registry, [], {
      "US-15/AT-2": { status: "covered-by" },
    });

    expect(report.problems[0]?.message).toMatch(/needs a "by" story/);
  });

  it("flags a covered-by override that points to an unknown story", () => {
    const report = checkCoverage(registry, [], {
      "US-15/AT-2": { status: "covered-by", by: "US-99" },
    });

    expect(report.problems[0]?.message).toMatch(/unknown story/);
  });

  it("flags a covered-by override that points to its own story", () => {
    const report = checkCoverage(registry, [], {
      "US-15/AT-2": { status: "covered-by", by: "US-15" },
    });

    expect(report.problems[0]?.message).toMatch(/its own story/);
  });

  it("flags a tag that is not in the registry", () => {
    const report = checkCoverage(registry, [tagged("US-99", "AT-1")], {});

    expect(report.unknown).toHaveLength(1);
    expect(report.problems[0]?.message).toBe("unknown tag US-99/AT-1");
  });

  it("flags an AT that belongs to a different story", () => {
    const report = checkCoverage(registry, [tagged("US-15", "AT-9")], {});

    expect(report.unknown).toHaveLength(1);
    expect(report.problems[0]?.message).toBe("unknown tag US-15/AT-9");
  });

  it("flags an override with a malformed key", () => {
    const report = checkCoverage(registry, [], {
      "US-15": { status: "manual" },
    });

    expect(report.problems[0]?.message).toMatch(/expected US-15\/AT-3/);
  });

  it("flags an override that references an AT not in the registry", () => {
    const report = checkCoverage(registry, [], {
      "US-15/AT-9": { status: "manual" },
    });

    expect(report.problems[0]?.message).toMatch(/not in the registry/);
  });

  it("flags an invalid override status", () => {
    const report = checkCoverage(registry, [], {
      "US-15/AT-1": { status: "skipped" } as never,
    });

    expect(report.problems[0]?.message).toMatch(
      /expected "manual", "deferred" or "covered-by"/,
    );
  });

  it("sorts the uncovered list so the report is stable", () => {
    const sortable: typeof registry = {
      repository: "owner/repo",
      stories: {
        "US-15": {
          issue: 37,
          title: "Set my location",
          ats: [
            { id: "AT-1", title: "City" },
            { id: "AT-2", title: "Geolocation" },
            { id: "AT-3", title: "Permission denied" },
          ],
        },
        "CH-02": {
          issue: 42,
          title: "Seed items, stores and cities",
          ats: [
            { id: "AT-1", title: "Idempotent seed" },
            { id: "AT-2", title: "Catalog data" },
          ],
        },
      },
    };
    const report = checkCoverage(
      sortable,
      [tagged("US-15", "AT-1"), tagged("CH-02", "AT-1")],
      {},
    );

    expect(report.uncovered.map((at) => at.key)).toEqual([
      "CH-02/AT-2",
      "US-15/AT-2",
      "US-15/AT-3",
    ]);
  });

  it("checks a required story even when it has not started", () => {
    const report = checkCoverage(
      registry,
      [tagged("US-15", "AT-1"), tagged("US-15", "AT-2")],
      {},
      { required: ["CH-02"] },
    );

    expect(report.notStarted).toEqual([]);
    expect(report.uncovered.map((at) => at.key)).toEqual(["CH-02/AT-1"]);
    expect(report.uncovered[0].required).toBe(true);
  });

  it("does not mark a started story's gaps as required", () => {
    const report = checkCoverage(
      registry,
      [tagged("US-15", "AT-1")],
      {},
      { required: ["CH-02"] },
    );

    const us = report.uncovered.find((at) => at.story === "US-15");

    expect(us?.required).toBe(false);
  });

  it("accepts a manual override on a required story", () => {
    const report = checkCoverage(
      registry,
      [],
      { "CH-02/AT-1": { status: "manual" } },
      { required: ["CH-02"] },
    );

    expect(report.uncovered).toEqual([]);
    expect(report.manual).toEqual(["CH-02/AT-1"]);
  });

  it("fails a deferred AT on a required story", () => {
    const report = checkCoverage(
      registry,
      [],
      { "CH-02/AT-1": { status: "deferred" } },
      { required: ["CH-02"] },
    );

    expect(report.problems.map((problem) => problem.message)).toEqual([
      "deferred AT CH-02/AT-1 belongs to #42, which this PR closes",
    ]);
  });
});
