import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));

describe(
  "AT-5 — Required check: a failing traceability or acceptance job fails CI",
  { tags: ["acceptance", "CH-03b", "AT-5"] },
  () => {
    const ci = readFileSync(join(ROOT, ".github/workflows/ci.yml"), "utf8");

    it("has a traceability job and an acceptance job", () => {
      expect(ci).toContain("name: Acceptance traceability (US/AT)");
      expect(ci).toContain("name: Acceptance tests (US/AT)");
    });

    it("makes the aggregate CI check wait for both", () => {
      expect(ci).toContain(
        "needs: [changes, quality, traceability, acceptance, database]",
      );
    });

    it("fails the aggregate when either job fails", () => {
      expect(ci).toContain("TRACEABILITY: ${{ needs.traceability.result }}");
      expect(ci).toContain("ACCEPTANCE: ${{ needs.acceptance.result }}");
      expect(ci).toContain(
        'for result in "$CHANGES" "$QUALITY" "$TRACEABILITY" "$ACCEPTANCE" "$DATABASE"; do',
      );
    });
  },
);
