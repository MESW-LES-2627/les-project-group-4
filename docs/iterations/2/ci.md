# CI changes in Iteration 2

> FurniMi · LES - Team D · FEUP 2026/27

The full pipeline — static checks, unit tests, build, the database job,
deployment and rollback — is documented in [Iteration 1's ci.md](../1/ci.md),
which was updated as CH-03 landed. This page records what the iteration changed
and what a reviewer should look at in the Iteration 2 runs.

## What CH-03 added

| Change | Where | What it does |
| --- | --- | --- |
| **Two Vitest projects** | `vitest.config.mts` | `unit` runs `src/**` and `tools/**`; `acceptance` runs `tests/acceptance/**/*.test.ts(x)`. |
| **One directory per story, one file per AT** | `tests/acceptance/US-xx-*/` | A failure names the story and the acceptance test, not just a module. |
| **US/AT tags** | Every acceptance test | `acceptance`, `US-xx`, `AT-n`; `strictTags` rejects an undefined tag during any Vitest run. |
| **Registry** | `tests/registry.json` | Generated from the issue bodies by `npm run acceptance:sync`; maps story → issue → ATs. |
| **Coverage gate** | `npm run acceptance:check` | Fails on an untagged file, an unknown tag, an uncovered automated AT in a started story, or registry drift. Strict by default. |
| **Manual/deferred/covered-by** | `tests/acceptance/overrides.json` | Exempts an AT with a written reason; `deferred` must name the issue it moved to. |
| **Acceptance traceability job** | `.github/workflows/ci.yml` | Runs the check in parallel with the suite, so a mapping failure does not hide the test report. Also checks the issue the PR closes. |
| **Acceptance tests job** | `.github/workflows/ci.yml` | Runs the acceptance project with JSON and JUnit reporters, uploads `reports/`, and writes a summary grouped by story. |
| **Regression labels** | `npm run acceptance:baseline` | Runs the suite at the merge base and labels each AT `regression`, `new test`, `pre-existing`, `fixed` or `removed`. |
| **Focused jobs** | `.github/workflows/ci.yml` | Static checks, unit tests, build, acceptance traceability and acceptance tests are separate jobs behind the aggregate `CI` check. |

## What is still manual

These ATs are `manual` in `overrides.json` and are the reasons CH-05 (#66)
exists:

- **US-09b**: AT-1 (workspace layout), AT-2 (card hierarchy), AT-4 (empty
  state) and AT-5 (keyboard/focus). Only AT-3 has an automated test.
- **US-13b / US-14b**: save confirmation, the empty-plan guard (US-13b AT-6)
  and the saved-layouts list/empty state.
- **US-01, US-03, US-07**: form confirmation, details rendering and catalog
  rendering.
- **CH-01 / CH-02**: deploy and seed checks that only a real environment can
  prove.

The `manual` count is the metric to watch in Iteration 3: CH-05 should move the
component-level ones to automated tests and remove their overrides.

## Running the checks locally

```sh
npm test                                      # both projects
npm run acceptance:check -- --issue 82         # the story a PR closes
npm run acceptance:check -- --offline          # skip the GitHub registry read
npm run acceptance:report -- --head reports/head.json
```

See [tests/acceptance/README.md](../../../tests/acceptance/README.md) for the
report and baseline commands, and [tests/registry.json](../../../tests/registry.json)
for the current story/AT mapping.

## Deployment

Unchanged: `develop` deploys staging, `main` deploys production, both run
`prisma migrate deploy` and the idempotent seed, then the `/api/health` smoke
test. The Iteration 2 release is a `develop` → `main` pull request, as in
Iteration 1. See [deployment.md](../1/deployment.md).
