# Retrospective - Iteration 1

> FurniMi · LES - Team D · FEUP 2026/27

Iteration 1 (23 Oct - 6 Nov 2026) completed O1 with the room list
(US-02), room details (US-03) and location (US-15), started O2 with the
catalog (US-07), and set up the 2D plan (US-06a/b). It also added the
staging and production deployment (CH-01) and the seed data (CH-02).

## How the Iteration 0 changes went

| Change we promised | What happened |
| --- | --- |
| Deploy staging and production | Done (#51, #53). `develop` deploys staging, `main` deploys production, and both run migrations and the seed. |
| Issue number in branch names | Done for every feature and chore branch (`feat/issue-37-room-location`, `chore/issue-42-seed-data`, ...). Docs branches have no issue, so they kept `docs/<description>`. |
| Keep the board honest | Partly. Issues merged into `develop` do not close themselves (`main` is the default branch), so some stayed open after their PR was merged (e.g. #54 after #55) until someone closed them by hand. |

## What went well

- **Reviews caught real bugs.** Reviews were not just approvals. On #56,
  a review found a race in "Use my location" and location errors that
  were silently dropped, and both were fixed before merge (see
  [ai-log.md](ai-log.md)).
- **Shared contracts first.** The plan geometry (US-06b, #47) defined
  the centimetre contract before the renderer (US-06a, #52) was built
  on it, so the two could be worked on in parallel.
- **Deploy is no longer a risk.** Staging has been live since #51, and
  every PR runs lint, typecheck, build, tests, and the migrations and
  seed on a fresh database in CI.
- **We adapted to losing a member.** One member left during the
  iteration. The other three covered the iteration's stories between
  them.

## What went badly

- **The work landed at the end.** Most PRs were merged or still open in
  the last three days (3-6 Nov). That left little time for reviews and
  forced them to happen in parallel with the release PR (#58).
- **PRs touched the same files.** #52, #55 and #56 all changed
  `RoomDetails.tsx` or `RoomList.tsx`, and we had to agree on a merge
  order and fix conflicts by hand.
- **No component tests.** The project has no jsdom or Testing Library,
  so UI logic is only tested through pure helper functions. The #56
  race passed every test.

## What we will change in Iteration 2

| Change | How we will know it worked |
| --- | --- |
| **Open PRs early and small**: open a draft PR as soon as a story has a first working slice, and aim to have each Must story in review by the end of the first week. | No Must story is opened for review in the last two days of the iteration. |
| **Say which shared files a story touches**: when picking a story, list in the issue the shared components it changes (e.g. `RoomDetails.tsx`), so overlapping work is planned instead of discovered in review. | Fewer merge conflicts between feature PRs. |
| **Add component tests**: add jsdom and Testing Library to Vitest and test the interactive components (forms, location field, plan). | At least one component test per new interactive component. |
| **Close issues when the PR is merged**: whoever merges a PR into `develop` closes its issue in the same step. | The board matches GitHub on the last day without a clean-up pass. |
