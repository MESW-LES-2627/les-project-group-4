# Acceptance tests

Tests that verify an acceptance test (AT) from a story issue. They live here
instead of next to the code so the suite reads by story and CI can report which
story and which AT broke.

Vitest is split into two projects:

| Project | What it runs | Files |
| --- | --- | --- |
| `unit` | tests for a helper, component or route in isolation, plus the repo tooling under `tools/` | `src/**`, `tools/**` |
| `acceptance` | tests that verify an AT from an issue | `tests/acceptance/**/*.test.ts(x)` |

Only tests that verify an AT belong in this directory; anything else stays next
to the code it covers.

## Running

```sh
npm test                            # both projects
npm test -- --project acceptance    # only the acceptance tests
npm test -- --project unit          # only the unit tests
```

The `acceptance` project contains the migrated stories (US-01, US-03,
US-06/06a/06b, US-07, US-15, CH-01, CH-02 and CH-03a); `--project acceptance`
runs only those tests.

## Report and regressions

CI turns the acceptance run into a job summary grouped by story: user stories
first, chores after, with one collapsible block per started story. Failing
stories are open and first in their section, and stories with no tests yet are
listed on one line instead of getting a block. The same report can be produced
locally:

```sh
mkdir -p reports
npx vitest run --project acceptance \
  --reporter=json --includeTaskLocation \
  --outputFile reports/head.json

npm run acceptance:report -- --head reports/head.json
```

`--includeTaskLocation` is what makes `file:line` appear in the report. To
compare against a base commit:

```sh
npm run acceptance:baseline -- --base <sha> --out reports/base.json
npm run acceptance:report -- --head reports/head.json --base reports/base.json
```

With `--base` the summary adds a Change column and prints GitHub annotations:

| Change | Meaning |
| --- | --- |
| regression | passed on the base, fails now |
| new test | did not exist on the base |
| pre-existing | already failed on the base |
| fixed | failed on the base, passes now |
| removed | existed on the base, no longer runs |

Regressions and new failures are `::error`; pre-existing failures are
`::warning`. `GITHUB_STEP_SUMMARY` is written automatically when it is set.

## Checking the mapping

```sh
npm run acceptance:check                  # fail on any gap (default)
npm run acceptance:check -- --warn        # report gaps, exit 0
npm run acceptance:check -- --drift-warn  # report a stale registry, exit 0
npm run acceptance:check -- --offline     # skip the registry drift check
npm run acceptance:check -- --issue 63    # also require CH-03b's ATs
npm run acceptance:check -- --pr 67       # resolve the PR's linked issues via gh
```

`--strict` is still accepted for compatibility; strict is the default. The check
reads the `tags` arrays from the test sources, so the tag list must be
a literal array in the test call (not built at runtime). It verifies that every
acceptance test file carries at least one `US`/`AT` tag, that each tag exists in
the registry, that no started story has an uncovered automated AT, and that
`tests/registry.json` still matches the issues. ATs listed in `overrides.json`
are exempt from the coverage rule.

A story is "started" when it has at least one tagged test or an override. The
ATs of stories nobody has started yet are reported and ignored by the gate, so
it fails on gaps in current work, not on the whole backlog.

CI runs `npm run acceptance:check` in its own `Acceptance traceability` job,
in parallel with the acceptance tests, so the report is still produced when
the mapping fails. The job summary lists the gaps even when the step is red.
`--strict` is redundant now, but the command still works.

Drift is fatal only on a pull request that touches `tests/`; on a push, or a PR
that does not touch the tests, CI passes `--drift-warn`, so an unrelated issue
edit cannot block the repo.

### The issue the PR closes

On pull requests the check also resolves the issue the PR closes — from
`closingIssuesReferences`, then a `Closes #n` line, then the
`type/issue-<n>-slug` branch — and requires that story's ATs even if the story
has not started yet. Every AT must be covered by a tagged test, `manual`, or
`covered-by`; a `deferred` AT fails because the PR claims the issue is done.

A PR with no linked issue is reported and skips the rule, so docs-only PRs are
not blocked. Unknown issue numbers (the legacy issues #1–#7) are reported and
skipped. This needs `pull-requests: read` in addition to `issues: read`.

## Layout

One directory per story, one file per AT (or a small group of related ATs):

```
tests/acceptance/US-15-set-my-location/
  AT-1-city.test.ts
  AT-2-geolocation.test.ts
  AT-3-permission-denied.test.ts
```

## Registry and overrides

`tests/registry.json` is generated from the issues by `npm run acceptance:sync`
and maps each story to its issue number and ATs. Do not edit it by hand. The
generator and the check live in `tools/acceptance/`.

Automation status lives in `tests/acceptance/overrides.json`, keyed by
`US-15/AT-3`, with `manual`, `deferred` or `covered-by`. `covered-by` also
takes `by`, the story whose tests cover the AT (for sub-stories such as
`US-06a`).

## Tags

Every acceptance test is tagged with `acceptance`, the story id and the AT id
(`US-15`, `AT-3`). AT ids are only unique inside a story, so the key is always
`US-15/AT-3` — never `AT-3` alone. Tag the `describe` when the whole block
verifies one AT: Vitest inherits the tags down to its tests.

The valid tags are generated from `tests/registry.json` and declared in
`vitest.config.mts`, so Vitest rejects an undefined tag during `npm test` as
well. `npm run acceptance:check` also fails an acceptance test file that has no
`US`/`AT` tags at all.
