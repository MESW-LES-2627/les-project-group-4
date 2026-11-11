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
 * Closing references first, then a `Closes #n` in the body, then the
 * `type/issue-<n>-slug` branch convention.
 */
export function linkedIssuesForPullRequest(pr: number): PullRequestLinks {
  const raw = gh([
    "pr",
    "view",
    String(pr),
    "--json",
    "closingIssuesReferences,body,headRefName",
  ]);

  const data = JSON.parse(raw) as {
    closingIssuesReferences?: Array<{ number: number }>;
    body?: string;
    headRefName?: string;
  };

  const linked = (data.closingIssuesReferences ?? []).map(
    (reference) => reference.number,
  );
  if (linked.length > 0) {
    return { issues: [...new Set(linked)].sort((a, b) => a - b) };
  }

  const fromBody = parseClosingIssues(data.body);
  if (fromBody.length > 0) return { issues: fromBody };

  const fromBranch = data.headRefName?.match(/issue-(\d+)/i);
  return { issues: fromBranch ? [Number(fromBranch[1])] : [] };
}
