import { describe, expect, it } from "vitest";

import { classify } from "../../../tools/acceptance/classify";
import { atResult, summaryOf } from "./fixtures";

describe(
  "AT-2 — Regression: a test that passed on the base and fails now is a regression",
  { tags: ["acceptance", "CH-03b", "AT-2"] },
  () => {
    it("labels pass -> fail as a regression", () => {
      const classification = classify(
        summaryOf([atResult("US-15/AT-3", "passed")]),
        summaryOf([atResult("US-15/AT-3", "failed")]),
      );

      expect(classification.entries[0].kind).toBe("regression");
      expect(classification.counts.regression).toBe(1);
    });
  },
);
