# AI Log - Iteration 0

> FurniMi · LES – Team D · FEUP 2026/27

AI was used as an assistant, not as an author: every suggestion was read,
changed where needed and reviewed by a team member before it entered the
repository.

## Tools used

| Tool | What we used it for |
| --- | --- |
| Open Design | Drafting prototypes and exploring the interface before implementing it. |
| OpenCode (DeepSeek V4.1 Flash) | The frontend move during the stack migration, refactoring, and general coding help. |

## One place the model was wrong

**Context.** We were documenting the CI pipeline in `ci.md` and reviewing
the test step in `.github/workflows/ci.yml`. At the time, the workflow
checked whether `package.json` had a `test` script and skipped `npm test`
when it did not.

**What the model suggested.** It described that guard as a harmless
leftover and wrote that the test step was "unconditional in practice",
implying the workflow needed no change. That was wrong: the `if:
steps.test.outputs.exists == 'true'` condition was still there. If the
`test` script were ever removed or renamed, the Test step would be
skipped, `quality` would still pass, and CI would report green without
running a single test.

**What we changed.** We pointed out that tests already exist (two files,
17 tests), removed the "Check for a test script" step, and made
`npm test` unconditional. Deleting the script now fails the job loudly
with `Missing script: "test"` instead of silently skipping the suite. We
also rewrote the `ci.md` section to explain why the guard existed during
the gap between the CI commit and the tests landing, rather than
presenting it as current behaviour.

**Why it matters.** "CI is green" is not evidence that tests ran. The
model normalized a stale workaround because it read the YAML as
intended behaviour instead of asking whether the condition could still
be false. The lesson is to check the guard, not just the step name:
after the change, `npm test` (17 passed), `npm run lint` and `npm run
typecheck` were run locally to confirm the new path.
