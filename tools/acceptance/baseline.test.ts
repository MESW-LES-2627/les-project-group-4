import { describe, expect, it } from "vitest";

import { shouldRunBaseline } from "./baseline";

const ready = {
  base: "abc123",
  hasConfig: true,
  hasSuite: true,
  depsChanged: false,
};

describe("shouldRunBaseline", () => {
  it("runs when the base has the config, the suite and the same lockfile", () => {
    expect(shouldRunBaseline(ready)).toBeNull();
  });

  it("skips when no base commit was given", () => {
    expect(shouldRunBaseline({ ...ready, base: undefined })).toBe("missing-base");
  });

  it("skips when the base has no vitest config", () => {
    expect(shouldRunBaseline({ ...ready, hasConfig: false })).toBe(
      "missing-config",
    );
  });

  it("skips when the base has no acceptance suite yet", () => {
    expect(shouldRunBaseline({ ...ready, hasSuite: false })).toBe(
      "missing-suite",
    );
  });

  it("skips when the lockfile changed, so the dependency trees differ", () => {
    expect(shouldRunBaseline({ ...ready, depsChanged: true })).toBe(
      "deps-changed",
    );
  });

  it("reports the first reason that applies", () => {
    expect(
      shouldRunBaseline({
        base: undefined,
        hasConfig: false,
        hasSuite: false,
        depsChanged: true,
      }),
    ).toBe("missing-base");
  });
});
