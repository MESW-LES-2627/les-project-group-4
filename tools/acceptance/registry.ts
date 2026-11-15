// Turns the "## Acceptance tests" section of a GitHub issue into the committed
// registry that maps every story to its issue number and its ATs.
//
// The issue body is the source of truth: `npm run acceptance:sync` regenerates
// `tests/registry.json` from it. Automation status (automated / manual /
// deferred) is not stored here because the generator would overwrite it; it
// lives in tests/acceptance/overrides.json instead.

export interface AcceptanceTest {
  id: string;
  title: string;
}

export interface StoryEntry {
  /** GitHub issue number, e.g. 37 for US-15. */
  issue: number;
  /** Story title without the `US-15:` prefix. */
  title: string;
  /** ATs in the order they appear in the issue. */
  ats: AcceptanceTest[];
}

export interface Registry {
  /** `owner/repo`, used to build issue links in the CI report. */
  repository: string;
  stories: Record<string, StoryEntry>;
}

export interface IssueInput {
  number: number;
  title: string;
  body: string | null;
}

export interface BuildResult {
  registry: Registry;
  /** Issues with an AT section whose title has no `US-xx` / `CH-xx` key. */
  skipped: Array<{ issue: number; title: string }>;
}

// `US-06a` and `US-02a` are real sub-story keys, hence the optional suffix.
const STORY_KEY = /^([A-Z]+-\d+[a-z]?):\s*(.+)$/;

// `- [ ] **AT-3 — Permission denied:** Given ...`
// The checkbox is the issue's own completion state and is ignored here.
const AT_LINE = /^\s*-\s*\[[ xX]\]\s*\*\*(AT-\d+)\s*[—–-]\s*(.+?)\*\*/;

const ACCEPTANCE_TESTS_HEADING = /^##\s+Acceptance tests\s*$/m;

export function parseAcceptanceTests(body: string | null): AcceptanceTest[] {
  if (!body) return [];

  const section = body.split(ACCEPTANCE_TESTS_HEADING)[1];
  if (!section) return [];

  const ats: AcceptanceTest[] = [];
  const seen = new Set<string>();

  for (const line of section.split("\n")) {
    const match = line.match(AT_LINE);
    if (!match) continue;

    const id = match[1];
    if (seen.has(id)) {
      throw new Error(`duplicate acceptance test ${id} in the same issue`);
    }
    seen.add(id);

    ats.push({ id, title: cleanTitle(match[2]) });
  }

  return ats;
}

function cleanTitle(title: string): string {
  return title.replace(/:\s*$/, "").trim();
}

export function storyKey(title: string): string | null {
  return title.match(STORY_KEY)?.[1] ?? null;
}

export function storyTitle(title: string): string | null {
  return title.match(STORY_KEY)?.[2].trim() ?? null;
}

export function buildRegistry(
  issues: readonly IssueInput[],
  repository: string,
): BuildResult {
  const stories: Record<string, StoryEntry> = {};
  const skipped: BuildResult["skipped"] = [];

  for (const issue of issues) {
    const key = storyKey(issue.title);
    if (!key) {
      skipped.push({ issue: issue.number, title: issue.title });
      continue;
    }

    const title = storyTitle(issue.title) ?? key;
    const ats = parseAcceptanceTests(issue.body);

    if (stories[key]) {
      throw new Error(
        `duplicate story ${key}: issues #${stories[key].issue} and #${issue.number}`,
      );
    }

    stories[key] = { issue: issue.number, title, ats };
  }

  return { registry: { repository, stories }, skipped };
}

/** Stable output: stories sorted by key, ATs in issue order, trailing newline. */
export function serializeRegistry(registry: Registry): string {
  const stories = Object.fromEntries(
    Object.entries(registry.stories).sort(([a], [b]) => a.localeCompare(b)),
  );

  return `${JSON.stringify({ repository: registry.repository, stories }, null, 2)}\n`;
}

/**
 * Compares the committed registry with a freshly generated one. Shared by
 * `acceptance:sync --check` and the CI drift check so both use the same rule.
 */
export function isRegistryStale(
  committed: string,
  registry: Registry,
): boolean {
  return committed !== serializeRegistry(registry);
}
