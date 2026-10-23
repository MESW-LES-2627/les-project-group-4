# AI Log - Iteration 0

> FurniMi · LES – Team D · FEUP 2026/27

AI was used as an assistant, not as an author: every suggestion was read,
changed where needed and reviewed by a team member before it entered the
repository.

## Tools used

| Tool | What we used it for |
| --- | --- |
| Open Design | Drafting prototypes and exploring the interface before implementing it. |
| OpenCode (DeepSeek V4.1 Flash) | The frontend move during the stack migration, refactoring, general coding help, and automating GitHub issue creation from the finished user stories. |
| Claude | Planning the move from Spring Boot + Vite to Next.js + Prisma, a first version of `POST /api/rooms` and its shared Zod schema (#2), drafting issue texts, reviewing pull requests, and checking `vision.md`, `mvp.md` and `stories.md` against each other. |

### Claude

- **Stack migration.** Compared the free-tier deploy options for Spring Boot
  and Next.js, then helped plan the move to Next.js + Prisma and port the
  existing React code (shadcn/ui, Tailwind tokens, typed API client) into
  `src/` on `chore/migrate-nextjs` (#17).
- **#2 `POST /api/rooms`.** Wrote a first version of the shared Zod schema
  (`src/lib/schemas/room.ts`) and the route handler
  (`src/app/api/rooms/route.ts`), with 201 / 400 `{ errors: { field: msg } }`
  / 500. João reviewed it and ran lint and build before opening #18.
- **Issues.** Drafted new texts for #2, #3 and #5 after the migration, plus
  the new CI and deploy issues. João edited and posted them.
- **PR reviews.** Reviewed #19, #20 and #21 against `develop` and the project
  conventions.
- **Docs consistency.** Checked `vision.md` and `stories.md` against
  `mvp.md` for #6 and listed where they disagreed (whether O5 was a stretch,
  and the iteration for US-15). The team then decided the scope in #22.

## One place the model was wrong

**Context.** We were documenting the CI pipeline in `ci.md` and reviewing
the test step in `.github/workflows/ci.yml`. At the time, the workflow
checked whether `package.json` had a `test` script and skipped `npm test`
when it did not.

**What the model suggested.** It described that guard as a harmless
leftover and wrote that the test step was "unconditional in practice",
implying the workflow needed no change. That was wrong: the condition on
`steps.test.outputs.exists` was still there. If the `test` script were
ever removed or renamed, the Test step would be skipped, `quality` would
still pass, and CI would report green without running a single test.

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
