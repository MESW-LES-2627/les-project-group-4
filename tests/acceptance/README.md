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

The `acceptance` project is empty until the first story is migrated (US-15), so
`--project acceptance` reports "No test files found" until then.

## Checking the mapping

```sh
npm run acceptance:check              # fail on any gap (default)
npm run acceptance:check -- --warn    # report gaps, exit 0
npm run acceptance:check -- --offline # skip the registry drift check
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

CI runs `npm run acceptance:check -- --strict` on every pull request; `--strict`
is redundant now, but the command still works.

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
