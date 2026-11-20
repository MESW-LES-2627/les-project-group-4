// GitHub access shared by the acceptance scripts. Only scripts import this;
// the app never does, so `gh` and the network stay out of the Next build.

import { execFileSync } from "node:child_process";

import type { IssueInput } from "./registry";

const ISSUE_FIELDS = ["number", "title", "body"];

export function gh(args: string[]): string {
  try {
    return execFileSync("gh", args, { encoding: "utf8" }).trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`gh ${args.join(" ")} failed:\n${message}`);
  }
}

/** All issues whose body has an acceptance tests section, open or closed. */
export function listIssuesWithAcceptanceTests(): IssueInput[] {
  const json = gh([
    "issue",
    "list",
    "--state",
    "all",
    "--limit",
    "500",
    "--json",
    ISSUE_FIELDS.join(","),
  ]);

  const issues = JSON.parse(json) as IssueInput[];
  return issues.filter((issue) => issue.body?.includes("## Acceptance tests"));
}

export function resolveRepository(): string {
  // GITHUB_REPOSITORY is set by Actions; fall back to gh locally.
  return (
    process.env.GITHUB_REPOSITORY ??
    gh(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"])
  );
}
