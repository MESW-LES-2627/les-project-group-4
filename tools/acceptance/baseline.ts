// Runs the acceptance and components projects at the merge-base in a
// throwaway worktree, so the report can tell a regression from a new test.
//
//   npm run acceptance:baseline -- --base <sha> --out reports/base.json
//
// The baseline is best effort: a missing suite, a dependency change or a
// broken run skips it instead of failing the pull request.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

export type BaselineSkip =
  "missing-base" | "missing-config" | "missing-suite" | "deps-changed";

export interface BaselineInput {
  base?: string;
  hasConfig: boolean;
  hasSuite: boolean;
  depsChanged: boolean;
}

/** Pure decision: null means run the baseline, otherwise the skip reason. */
export function shouldRunBaseline(input: BaselineInput): BaselineSkip | null {
  if (!input.base) return "missing-base";
  if (!input.hasConfig) return "missing-config";
  if (!input.hasSuite) return "missing-suite";
  if (input.depsChanged) return "deps-changed";
  return null;
}

/**
 * The Vitest projects whose results the report compares. CH-05: the component
 * tests (`*.dom.test.tsx`, project `components`) are acceptance tests too. A
 * base from before CH-05 has no such project; Vitest then runs acceptance only.
 */
export const BASELINE_PROJECTS = ["acceptance", "components"] as const;

export interface BaselineResult {
  status: "written" | "skipped" | "unavailable";
  reason?: BaselineSkip | "vitest-failed";
  file?: string;
}

function existsAt(base: string, path: string): boolean {
  try {
    execFileSync("git", ["cat-file", "-e", `${base}:${path}`], {
      cwd: ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function depsChanged(base: string): boolean {
  try {
    execFileSync("git", ["diff", "--quiet", base, "--", "package-lock.json"], {
      cwd: ROOT,
      stdio: "ignore",
    });
    return false;
  } catch {
    return true;
  }
}

function isCommit(base: string): boolean {
  try {
    execFileSync("git", ["rev-parse", "--verify", `${base}^{commit}`], {
      cwd: ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

export function runBaseline({
  base,
  out,
}: {
  base: string;
  out: string;
}): BaselineResult {
  if (!isCommit(base)) return { status: "skipped", reason: "missing-base" };

  const decision = shouldRunBaseline({
    base,
    hasConfig: existsAt(base, "vitest.config.mts"),
    hasSuite: existsAt(base, "tests/acceptance"),
    depsChanged: depsChanged(base),
  });

  if (decision) return { status: "skipped", reason: decision };

  const output = resolve(out);
  mkdirSync(dirname(output), { recursive: true });

  const worktree = join(
    tmpdir(),
    `furnimi-baseline-${process.pid}-${Date.now()}`,
  );

  try {
    execFileSync("git", ["worktree", "add", "--detach", worktree, base], {
      cwd: ROOT,
      stdio: "ignore",
    });

    symlinkSync(
      join(ROOT, "node_modules"),
      join(worktree, "node_modules"),
      process.platform === "win32" ? "junction" : "dir",
    );

    try {
      execFileSync(
        process.execPath,
        [
          join(ROOT, "node_modules/vitest/vitest.mjs"),
          "run",
          ...BASELINE_PROJECTS.flatMap((project) => ["--project", project]),
          "--reporter=json",
          "--includeTaskLocation",
          `--outputFile=${output}`,
        ],
        { cwd: worktree, stdio: "inherit" },
      );
    } catch {
      // Failing tests are expected here; the JSON file is still written.
      if (!existsSync(output)) {
        return { status: "unavailable", reason: "vitest-failed" };
      }
    }

    return { status: "written", file: output };
  } finally {
    try {
      execFileSync("git", ["worktree", "remove", "--force", worktree], {
        cwd: ROOT,
        stdio: "ignore",
      });
    } catch {
      rmSync(worktree, { recursive: true, force: true });
    }
  }
}
