// Resolves which issues a pull request claims to close, so the traceability
// gate can require those stories' ATs even before the story has started.

import { gh } from "./github";
import type { Registry } from "./registry";

const CLOSING_REFERENCE =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi;

/** `Closes #63, closes #64` -> `[63, 64]`. */
export function parseClosingIssues(body: string | null | undefined): number[] {
  if (!body) return [];

  const numbers = new Set<number>();
  for (const match of body.matchAll(CLOSING_REFERENCE)) {
    numbers.add(Number(match[1]));
  }

  return [...numbers].sort((a, b) => a - b);
}

export function storyKeysForIssues(
  registry: Registry,
  issues: readonly number[],
): { stories: string[]; unknown: number[] } {
  const stories: string[] = [];
  const unknown: number[] = [];

  for (const issue of issues) {
    const entry = Object.entries(registry.stories).find(
      ([, story]) => story.issue === issue,
    );
    if (entry) stories.push(entry[0]);
    else unknown.push(issue);
  }

  return {
    stories: [...new Set(stories)],
    unknown: [...new Set(unknown)],
  };
}

export interface PullRequestLinks {
  issues: number[];
}

/**
 * Closing references first, then an explicit `Closes/Fixes/Resolves #n` in the
 * body. A branch name such as `type/issue-<n>-slug` is not a closing reference:
 * a partial PR can say "Part of #n" and must not be held to every AT.
 */
export function linkedIssuesForPullRequest(pr: number): PullRequestLinks {
  const raw = gh([
    "pr",
    "view",
    String(pr),
    "--json",
    "closingIssuesReferences,body",
  ]);

  const data = JSON.parse(raw) as {
    closingIssuesReferences?: Array<{ number: number }>;
    body?: string;
  };

  const linked = (data.closingIssuesReferences ?? []).map(
    (reference) => reference.number,
  );
  if (linked.length > 0) {
    return { issues: [...new Set(linked)].sort((a, b) => a - b) };
  }

  const fromBody = parseClosingIssues(data.body);
  if (fromBody.length > 0) return { issues: fromBody };

  // A branch name (issue-35) is not a closing reference: partial PRs say
  // "Part of #35" and must not need every AT of the issue yet.
  return { issues: [] };
}
