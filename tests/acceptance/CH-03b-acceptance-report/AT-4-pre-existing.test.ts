import { describe, expect, it } from "vitest";

import {
  classify,
  formatAnnotations,
} from "../../../tools/acceptance/classify";
import { atResult, summaryOf } from "./fixtures";

describe(
  "AT-4 — Pre-existing: a failure already on the base is not blamed on the PR",
  { tags: ["acceptance", "CH-03b", "AT-4"] },
  () => {
    const classification = classify(
      summaryOf([atResult("US-15/AT-3", "failed", { message: "broken on base" })]),
      summaryOf([atResult("US-15/AT-3", "failed", { message: "broken on base" })]),
    );

    it("labels fail -> fail as pre-existing", () => {
      expect(classification.entries[0].kind).toBe("pre-existing");
    });

    it("annotates it as a warning instead of an error", () => {
      expect(formatAnnotations(classification)[0]).toMatch(/^::warning /);
    });
  },
);
