# Retrospective - Iteration 0

> FurniMi · LES – Team D · FEUP 2026/27

Iteration 0 shipped the walking skeleton: US-01, from the form to
PostgreSQL and back. This is what worked, what did not, and what changes
in Iteration 1.

## What went well

- **We split the work before writing code.** The MVP became issues with
  acceptance criteria on a Scrum board from day one, so everyone knew
  what to pick up and what "done" meant.
- **Communication inside the team was constant.** Ideas, doubts and
  reviews moved quickly; nobody worked in isolation for long.
- **We discussed the product before building it.** Vision, MVP outcomes
  and scope cuts were debated thoroughly, which gave Iteration 0 an
  honest boundary: US-01 only, with the rest in the public cut.
- **We regrouped fast when plans broke.** When one member went quiet,
  the rest redistributed their issues. When the stack turned out to be
  wrong, we replanned and completed the migration instead of carrying
  the problem forward.
- **The process was in place from the start.** Issues, a project board,
  conventional commits and branches meant consistency
  and review also stayed consistent.

## What went badly

- **A communication gap went unnoticed for too long.** One member
  stopped responding and their issues stalled until someone checked in.
  The team redistributed the work and recovered, but we detected it
  late; a shorter feedback loop would have saved time.
- **We chose the stack before checking how it would deploy.** Spring
  Boot for the backend was heavier to deploy than the project needed, so
  late in the iteration we moved to Next.js. The new stack is the better
  long-term fit and the migration succeeded, but it consumed time that
  was planned for the increment.

## What we will change in Iteration 1

- **Deploy staging and production**: Add both environments: staging deploys from `develop`, production deploys from `main`. Put both URLs in `CLAIM.md`.
- **Add the issue number to branch names**: Keep the existing `<type>/<short-description>` convention and prefix the issue number: `<type>/issue-<number>-<short-description>`, where type is `feat`, `fix`, `chore`, `docs` or `test` (e.g. `feat/issue-<number>-room-details`). Check it in review and in CI where practical. | Every Iteration 1 branch includes its issue number, so the branch links back to the issue.
- **Keep the board honest**: Review the board once a week, limit work in progress and close or move stale issues. | The board matches reality on the last day, not just on day one.
