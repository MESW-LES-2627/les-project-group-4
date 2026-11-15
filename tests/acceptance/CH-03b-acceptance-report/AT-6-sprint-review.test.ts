import { describe, expect, it } from "vitest";

import type { Registry } from "../../../tools/acceptance/registry";
import { buildGroupedReport, formatGroupedMarkdown } from "../../../tools/acceptance/summary";
import { atResult, summaryOf } from "./fixtures";

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
    "CH-01": {
      issue: 41,
      title: "Set up staging and production deployment",
      ats: [{ id: "AT-1", title: "Staging deploy" }],
    },
  },
};

describe(
  "AT-6 — Sprint review: a green run shows every story, AT and issue link",
  { tags: ["acceptance", "CH-03b", "AT-6"] },
  () => {
    const head = summaryOf([
      atResult("US-15/AT-1", "passed"),
      atResult("US-15/AT-2", "passed"),
      atResult("CH-01/AT-1", "passed", { issue: 41 }),
    ]);
    const markdown = formatGroupedMarkdown(
      buildGroupedReport(head, registry),
      registry.repository,
      { stats: "3 passed · 0 failed" },
    );

    it("shows the user stories and chores sections", () => {
      expect(markdown).toContain("### User stories (1)");
      expect(markdown).toContain("### Chores (1)");
      expect(markdown).toContain("3 passed · 0 failed");
    });

    it("shows every AT with its issue link", () => {
      expect(markdown).toContain("AT-1 — City");
      expect(markdown).toContain("AT-2 — Geolocation");
      expect(markdown).toContain("AT-1 — Staging deploy");
      expect(markdown).toContain(
        '<a href="https://github.com/owner/repo/issues/37">#37</a>',
      );
      expect(markdown).toContain(
        '<a href="https://github.com/owner/repo/issues/41">#41</a>',
      );
    });

    it("keeps a green summary collapsed", () => {
      expect(markdown).not.toContain("<details open>");
    });
  },
);
