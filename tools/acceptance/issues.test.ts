import { describe, expect, it } from "vitest";

import { parseClosingIssues, storyKeysForIssues } from "./issues";
import type { Registry } from "./registry";

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
      ats: [{ id: "AT-1", title: "Reported failure" }],
    },
  },
};

describe("parseClosingIssues", () => {
  it("reads a single closing reference", () => {
    expect(parseClosingIssues("Closes #63")).toEqual([63]);
  });

  it("reads the variants GitHub accepts, case-insensitively", () => {
    expect(
      parseClosingIssues("fixes #3, Fixed #4\nresolves #5\nclosed #6"),
    ).toEqual([3, 4, 5, 6]);
  });

  it("dedupes and sorts the issues", () => {
    expect(parseClosingIssues("Closes #63 and closes #37 and #63")).toEqual([
      37, 63,
    ]);
  });

  it("ignores references without a closing keyword", () => {
    expect(parseClosingIssues("See #63 and #37 for context")).toEqual([]);
  });

  it("handles an empty body", () => {
    expect(parseClosingIssues("")).toEqual([]);
    expect(parseClosingIssues(null)).toEqual([]);
  });
});

describe("storyKeysForIssues", () => {
  it("maps issue numbers to registry story keys", () => {
    expect(storyKeysForIssues(registry, [63, 37])).toEqual({
      stories: ["CH-03b", "US-15"],
      unknown: [],
    });
  });

  it("reports issues that are not stories in the registry", () => {
    expect(storyKeysForIssues(registry, [63, 5])).toEqual({
      stories: ["CH-03b"],
      unknown: [5],
    });
  });

  it("dedupes repeated issues", () => {
    expect(storyKeysForIssues(registry, [63, 63]).stories).toEqual(["CH-03b"]);
  });
});
