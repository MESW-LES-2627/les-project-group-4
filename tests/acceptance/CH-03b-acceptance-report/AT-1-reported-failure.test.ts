import { describe, expect, it } from "vitest";

import {
  changeLabels,
  classify,
  formatAnnotations,
} from "../../../tools/acceptance/classify";
import { buildGroupedReport, formatGroupedMarkdown } from "../../../tools/acceptance/summary";
import { atResult, registry, summaryOf } from "./fixtures";

describe(
  "AT-1 — Reported failure: the summary and annotation name the story, AT and issue",
  { tags: ["acceptance", "CH-03b", "AT-1"] },
  () => {
    const base = summaryOf([atResult("US-15/AT-3", "passed")]);
    const head = summaryOf([
      atResult("US-15/AT-3", "failed", {
        message: "expected the denied message, received the generic one",
      }),
    ]);
    const classification = classify(base, head);
    const markdown = formatGroupedMarkdown(
      buildGroupedReport(head, registry),
      registry.repository,
      { labels: changeLabels(classification) },
    );

    it("names the story, AT and issue in the summary", () => {
      expect(markdown).toContain("❌ US-15 · Set my location");
      expect(markdown).toContain(
        '<a href="https://github.com/owner/repo/issues/37">#37</a>',
      );
      expect(markdown).toContain("AT-3 — Permission denied");
      expect(markdown).toContain("<details open>");
    });

    it("points the annotation at the failing file and line", () => {
      const annotations = formatAnnotations(classification);

      expect(annotations).toEqual([
        "::error file=tests/acceptance/US-15/AT-3-0.test.ts,line=12," +
          "title=US-15/AT-3 — issue #37 (regression)::" +
          "expected the denied message, received the generic one",
      ]);
    });
  },
);
