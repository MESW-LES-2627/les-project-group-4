import { describe, expect, it } from "vitest";

import {
  changeLabels,
  classify,
  formatAnnotations,
  formatClassifiedText,
} from "./classify";
import type { AtResult, AtStatus, AtSummary } from "./report";

const result = (
  key: string,
  status: AtStatus,
  options: Partial<AtResult> = {},
): AtResult => {
  const [story, at] = key.split("/");
  return {
    key,
    story,
    at,
    title: at,
    issue: 37,
    known: true,
    status,
    tests: [
      {
        story,
        at,
        file: "tests/acceptance/US-15/AT-1-city.test.ts",
        line: 12,
        fullName: "test",
        status: status === "passed" ? "passed" : "failed",
        messages: status === "failed" ? ["expected 1 to be 2"] : [],
      },
    ],
    ...options,
  };
};

const summary = (results: AtResult[]): AtSummary => ({
  results,
  untagged: 0,
  tagged: results.length,
});

const kindOf = (base: AtSummary | null, head: AtSummary) =>
  Object.fromEntries(
    classify(base, head).entries.map((entry) => [entry.result.key, entry.kind]),
  );

describe("classify", () => {
  it("labels pass -> fail as a regression", () => {
    const kinds = kindOf(
      summary([result("US-15/AT-1", "passed")]),
      summary([result("US-15/AT-1", "failed")]),
    );

    expect(kinds).toEqual({ "US-15/AT-1": "regression" });
  });

  it("labels a test that did not exist on the base as new", () => {
    const kinds = kindOf(summary([]), summary([result("US-15/AT-1", "failed")]));

    expect(kinds).toEqual({ "US-15/AT-1": "new" });
  });

  it("labels fail -> fail as pre-existing", () => {
    const kinds = kindOf(
      summary([result("US-15/AT-1", "failed")]),
      summary([result("US-15/AT-1", "failed")]),
    );

    expect(kinds).toEqual({ "US-15/AT-1": "pre-existing" });
  });

  it("labels fail -> pass as fixed", () => {
    const kinds = kindOf(
      summary([result("US-15/AT-1", "failed")]),
      summary([result("US-15/AT-1", "passed")]),
    );

    expect(kinds).toEqual({ "US-15/AT-1": "fixed" });
  });

  it("labels a test that disappeared from the head run as removed", () => {
    const kinds = kindOf(
      summary([result("US-15/AT-1", "passed")]),
      summary([]),
    );

    expect(kinds).toEqual({ "US-15/AT-1": "removed" });
  });

  it("treats a skipped base test as not having run, so the failure is new", () => {
    const kinds = kindOf(
      summary([result("US-15/AT-1", "skipped")]),
      summary([result("US-15/AT-1", "failed")]),
    );

    expect(kinds).toEqual({ "US-15/AT-1": "new" });
  });

  it("uses failed, not regression, when there is no baseline", () => {
    const kinds = kindOf(null, summary([result("US-15/AT-1", "failed")]));

    expect(kinds).toEqual({ "US-15/AT-1": "failed" });
  });

  it("counts every category", () => {
    const base = summary([
      result("US-15/AT-1", "passed"),
      result("US-15/AT-2", "failed"),
      result("US-15/AT-3", "passed"),
      result("US-15/AT-4", "failed"),
    ]);
    const head = summary([
      result("US-15/AT-1", "failed"),
      result("US-15/AT-2", "failed"),
      result("US-15/AT-3", "passed"),
      result("US-15/AT-5", "failed"),
    ]);

    const classification = classify(base, head);

    expect(classification.counts).toMatchObject({
      regression: 1,
      new: 1,
      "pre-existing": 1,
      removed: 1,
      pass: 1,
    });
  });
});

describe("changeLabels", () => {
  it("gives a label only to the categories worth printing", () => {
    const classification = classify(
      summary([result("US-15/AT-1", "passed")]),
      summary([result("US-15/AT-1", "failed")]),
    );

    expect(changeLabels(classification)).toEqual({ "US-15/AT-1": "regression" });
  });
});

describe("formatAnnotations", () => {
  const failing = (kindKey: string, status: AtStatus = "failed") =>
    result(kindKey, status);

  it("annotates a regression as an error with the file, line and issue", () => {
    const classification = classify(
      summary([failing("US-15/AT-1", "passed")]),
      summary([failing("US-15/AT-1")]),
    );

    const annotations = formatAnnotations(classification);

    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toContain(
      "::error file=tests/acceptance/US-15/AT-1-city.test.ts,line=12",
    );
    expect(annotations[0]).toContain(
      "title=US-15/AT-1 — issue #37 (regression)",
    );
    expect(annotations[0]).toContain("::expected 1 to be 2");
  });

  it("annotates a pre-existing failure as a warning", () => {
    const classification = classify(
      summary([failing("US-15/AT-1")]),
      summary([failing("US-15/AT-1")]),
    );

    expect(formatAnnotations(classification)[0]).toMatch(/^::warning /);
  });

  it("annotates a new failure as an error", () => {
    const classification = classify(summary([]), summary([failing("US-15/AT-1")]));

    expect(formatAnnotations(classification)[0]).toMatch(
      /^::error .*\(new test\)::/,
    );
  });

  it("does not annotate fixed or passing ATs", () => {
    const classification = classify(
      summary([failing("US-15/AT-1"), failing("US-15/AT-2", "passed")]),
      summary([failing("US-15/AT-1", "passed"), failing("US-15/AT-2", "passed")]),
    );

    expect(formatAnnotations(classification)).toEqual([]);
  });

  it("escapes % and carriage returns in the message", () => {
    const head = result("US-15/AT-1", "failed");
    head.tests[0].messages = ["50%\rfailed"];

    const classification = classify(summary([]), summary([head]));

    expect(formatAnnotations(classification)[0]).toContain("::50%25%0Dfailed");
  });
});

describe("classified formatting", () => {
  it("prints the counts and the change labels", () => {
    const classification = classify(
      summary([failingResult()]),
      summary([result("US-15/AT-1", "failed")]),
    );

    const text = formatClassifiedText(classification);

    expect(text).toContain("0 passed · 1 failed · 1 regression");
    expect(text).toContain("[regression]");
  });

});

function failingResult(): AtResult {
  return result("US-15/AT-1", "passed");
}
