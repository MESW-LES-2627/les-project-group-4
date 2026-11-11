// Reads the `US-xx` / `AT-n` tags out of the acceptance test files and checks
// them against the registry. The tags are the link between a test and the issue
// that defines it; the file path is not, so files can move without losing the
// mapping.

import type { Registry } from "./registry";

const TAG_ARRAY = /tags:\s*\[([^\]]*)\]/g;
const STORY_TAG = /^(?:US|CH)-\d+[a-z]?$/;
const AT_TAG = /^AT-\d+$/;

export interface TagPair {
  story: string;
  at: string;
  file: string;
  line: number;
}

export interface ScanProblem {
  file: string;
  line: number;
  message: string;
}

export interface Override {
  status: "manual" | "deferred" | "covered-by";
  note?: string;
  /** For `covered-by`: the story whose tests cover this AT. */
  by?: string;
}

export type Overrides = Record<string, Override>;

export interface UncoveredAt {
  key: string;
  story: string;
  issue: number;
  at: string;
  title: string;
}

export interface CheckReport {
  /** One entry per tagged test. */
  pairs: TagPair[];
  /** Malformed tags, bad overrides. */
  problems: ScanProblem[];
  /** Tags that reference a story or AT the registry does not have. */
  unknown: TagPair[];
  /** Acceptance test files with no `US`/`AT` tags at all. */
  untagged: string[];
  /** Automated ATs with no test and no override. */
  uncovered: UncoveredAt[];
  /** ATs deliberately left to a manual check. */
  manual: string[];
  /** ATs covered by the tests of another story (e.g. a sub-story). */
  coveredBy: string[];
  /** Stories with no tagged test and no override; --strict ignores them. */
  notStarted: string[];
}

/**
 * A test opts in with `tags: ['acceptance', 'US-15', 'AT-3']`. Exactly one
 * story tag and one AT tag per array; anything else is reported instead of
 * guessed.
 */
export function scanTags(
  file: string,
  source: string,
): { pairs: TagPair[]; problems: ScanProblem[] } {
  const pairs: TagPair[] = [];
  const problems: ScanProblem[] = [];

  for (const match of source.matchAll(TAG_ARRAY)) {
    const line = lineAt(source, match.index ?? 0);
    const tags = match[1]
      .split(",")
      .map((tag) => tag.trim().replace(/^['"`]|['"`]$/g, ""))
      .filter(Boolean);

    const stories = tags.filter((tag) => STORY_TAG.test(tag));
    const ats = tags.filter((tag) => AT_TAG.test(tag));

    if (stories.length === 0 && ats.length === 0) continue;

    if (stories.length !== 1 || ats.length !== 1) {
      problems.push({
        file,
        line,
        message: `expected exactly one story tag and one AT tag, got [${tags.join(", ")}]`,
      });
      continue;
    }

    pairs.push({ story: stories[0], at: ats[0], file, line });
  }

  return { pairs, problems };
}

function lineAt(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

export function checkCoverage(
  registry: Registry,
  files: ReadonlyArray<{ file: string; source: string }>,
  overrides: Overrides = {},
): CheckReport {
  const pairs: TagPair[] = [];
  const problems: ScanProblem[] = [];
  const untagged: string[] = [];

  for (const { file, source } of files) {
    const scan = scanTags(file, source);
    pairs.push(...scan.pairs);
    problems.push(...scan.problems);
    if (scan.pairs.length === 0 && scan.problems.length === 0) {
      untagged.push(file);
    }
  }

  for (const [key, override] of Object.entries(overrides)) {
    const [story, at] = key.split("/");
    if (!story || !at) {
      problems.push({
        file: "overrides.json",
        line: 0,
        message: `invalid key "${key}", expected US-15/AT-3`,
      });
      continue;
    }
    if (!registry.stories[story]?.ats.some((entry) => entry.id === at)) {
      problems.push({
        file: "overrides.json",
        line: 0,
        message: `override references an AT that is not in the registry: ${key}`,
      });
      continue;
    }
    if (
      override?.status !== "manual" &&
      override?.status !== "deferred" &&
      override?.status !== "covered-by"
    ) {
      problems.push({
        file: "overrides.json",
        line: 0,
        message: `invalid status for ${key}: expected "manual", "deferred" or "covered-by"`,
      });
    }
    if (override?.status === "covered-by") {
      if (!override.by) {
        problems.push({
          file: "overrides.json",
          line: 0,
          message: `covered-by override for ${key} needs a "by" story`,
        });
      } else if (!registry.stories[override.by]) {
        problems.push({
          file: "overrides.json",
          line: 0,
          message: `covered-by override for ${key} points to an unknown story: ${override.by}`,
        });
      } else if (override.by === story) {
        problems.push({
          file: "overrides.json",
          line: 0,
          message: `covered-by override for ${key} points to its own story`,
        });
      }
    }
  }

  const unknown: TagPair[] = [];
  const covered = new Set<string>();

  for (const pair of pairs) {
    const story = registry.stories[pair.story];
    if (!story || !story.ats.some((entry) => entry.id === pair.at)) {
      unknown.push(pair);
      problems.push({
        file: pair.file,
        line: pair.line,
        message: `unknown tag ${pair.story}/${pair.at}`,
      });
      continue;
    }
    covered.add(`${pair.story}/${pair.at}`);
  }

  const uncovered: UncoveredAt[] = [];
  const manual: string[] = [];
  const coveredBy: string[] = [];
  const notStarted: string[] = [];

  // A story counts as started once it has a tagged test or an explicit
  // override. Until then its ATs are backlog, not gaps to fail the gate on.
  const started = new Set<string>();
  for (const pair of pairs) {
    if (covered.has(`${pair.story}/${pair.at}`)) started.add(pair.story);
  }
  for (const key of Object.keys(overrides)) {
    const [story] = key.split("/");
    if (story && registry.stories[story]) started.add(story);
  }

  for (const [storyKey, story] of Object.entries(registry.stories)) {
    if (!started.has(storyKey)) {
      notStarted.push(storyKey);
      continue;
    }
    for (const entry of story.ats) {
      const key = `${storyKey}/${entry.id}`;
      if (covered.has(key)) continue;
      const override = overrides[key];
      if (override) {
        if (override.status === "covered-by") coveredBy.push(key);
        else manual.push(key);
        continue;
      }
      uncovered.push({
        key,
        story: storyKey,
        issue: story.issue,
        at: entry.id,
        title: entry.title,
      });
    }
  }

  uncovered.sort((a, b) => a.key.localeCompare(b.key));
  manual.sort((a, b) => a.localeCompare(b));
  coveredBy.sort((a, b) => a.localeCompare(b));
  notStarted.sort((a, b) => a.localeCompare(b));
  untagged.sort((a, b) => a.localeCompare(b));

  return {
    pairs,
    problems,
    unknown,
    untagged,
    uncovered,
    manual,
    coveredBy,
    notStarted,
  };
}
