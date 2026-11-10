import { describe, expect, it } from "vitest";

import {
  buildRegistry,
  parseAcceptanceTests,
  serializeRegistry,
  storyKey,
  storyTitle,
} from "./registry";

const issue = (number: number, title: string, body: string | null) => ({
  number,
  title,
  body,
});

const body = `## User story

> As a user, I can set my location.

## Acceptance tests

- [ ] **AT-1 — City:** Given the seeded city list, when I choose "Porto", then Porto is stored.
- [x] **AT-2 — Geolocation:** Given HTTPS and granted permission, when I use my location, then coordinates are stored.
- [ ] **AT-3 — Permission denied:** Given denied permission, when I try, then a message is shown.

---

Source: [\`stories.md\`](https://example.test)
`;

describe("parseAcceptanceTests", () => {
  it("reads the AT id and title from the acceptance tests section", () => {
    expect(parseAcceptanceTests(body)).toEqual([
      { id: "AT-1", title: "City" },
      { id: "AT-2", title: "Geolocation" },
      { id: "AT-3", title: "Permission denied" },
    ]);
  });

  it("ignores the checkbox state and the lines after the section", () => {
    const ats = parseAcceptanceTests(body);

    expect(ats).toHaveLength(3);
    expect(ats.map((at) => at.title)).not.toContain("Source: `stories.md`");
  });

  it("returns nothing when the issue has no acceptance tests section", () => {
    expect(parseAcceptanceTests("## Tasks\n\n- [ ] do the thing")).toEqual([]);
    expect(parseAcceptanceTests(null)).toEqual([]);
  });

  it("rejects a duplicate AT id inside one issue", () => {
    const duplicate = `${body}\n- [ ] **AT-1 — Again:** duplicate\n`;

    expect(() => parseAcceptanceTests(duplicate)).toThrow(
      /duplicate acceptance test AT-1/,
    );
  });
});

describe("story keys", () => {
  it("accepts the sub-story suffix used by US-06a and US-02a", () => {
    expect(storyKey("US-06a: Plan2D renderer")).toBe("US-06a");
    expect(storyTitle("US-06a: Plan2D renderer")).toBe("Plan2D renderer");
  });

  it("returns null for a title without a story key", () => {
    expect(storyKey("Room domain layer and validation")).toBeNull();
    expect(storyTitle("Room domain layer and validation")).toBeNull();
  });
});

describe("buildRegistry", () => {
  it("maps stories to their issue number and ATs, and reports unkeyed issues", () => {
    const result = buildRegistry(
      [
        issue(37, "US-15: Set my location", body),
        issue(7, "Lock `mvp.md`", "## Acceptance tests\n"),
      ],
      "owner/repo",
    );

    expect(result.registry.repository).toBe("owner/repo");
    expect(result.registry.stories["US-15"]).toEqual({
      issue: 37,
      title: "Set my location",
      ats: [
        { id: "AT-1", title: "City" },
        { id: "AT-2", title: "Geolocation" },
        { id: "AT-3", title: "Permission denied" },
      ],
    });
    expect(result.skipped).toEqual([{ issue: 7, title: "Lock `mvp.md`" }]);
  });

  it("rejects two issues that claim the same story key", () => {
    expect(() =>
      buildRegistry(
        [
          issue(37, "US-15: Set my location", body),
          issue(99, "US-15: Duplicated story", body),
        ],
        "owner/repo",
      ),
    ).toThrow(/#37 and #99/);
  });
});

describe("serializeRegistry", () => {
  it("sorts stories by key and is stable across runs", () => {
    const { registry } = buildRegistry(
      [
        issue(37, "US-15: Set my location", body),
        issue(23, "US-01: Create a room", body),
      ],
      "owner/repo",
    );

    const first = serializeRegistry(registry);
    const second = serializeRegistry({
      ...registry,
      stories: {
        "US-15": registry.stories["US-15"],
        "US-01": registry.stories["US-01"],
      },
    });

    expect(first).toBe(second);
    expect(first.indexOf('"US-01"')).toBeLessThan(first.indexOf('"US-15"'));
    expect(first.endsWith("\n")).toBe(true);
  });
});
