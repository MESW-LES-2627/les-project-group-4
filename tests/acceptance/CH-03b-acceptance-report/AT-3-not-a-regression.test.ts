import { describe, expect, it } from "vitest";

import { changeLabels, classify } from "../../../tools/acceptance/classify";
import { atResult, summaryOf } from "./fixtures";

describe(
  "AT-3 — Not a regression: a test added in the PR is reported as new",
  { tags: ["acceptance", "CH-03b", "AT-3"] },
  () => {
    it("labels absent -> fail as a new test", () => {
      const classification = classify(
        summaryOf([]),
        summaryOf([atResult("US-15/AT-3", "failed")]),
      );

      expect(classification.entries[0].kind).toBe("new");
      expect(changeLabels(classification)["US-15/AT-3"]).toBe("new test");
      expect(classification.counts.regression).toBe(0);
    });
  },
);
