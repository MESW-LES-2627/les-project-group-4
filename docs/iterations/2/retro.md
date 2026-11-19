# Retrospective - Iteration 2

> FurniMi · LES - Team D · FEUP 2026/27

Iteration 2 (6 Nov - 20 Nov 2026) delivered the O2 catalog filters and
add-to-layout work (US-08, US-09a/US-09b), started O3 with the running total
(US-12), and delivered O4 one iteration early: layouts can be saved, listed,
opened and deleted (US-13, US-14). It also replaced the test layout with the
US/AT acceptance registry and a CI report that names the story that broke
(CH-03). O2 remains open for US-17 (nearest stores) in Iteration 4.

US-04 (edit room) and US-05 (delete room), the two Should stories planned for
this iteration, moved to Iteration 3. US-12 AT-5 (budget) became #85, also in
Iteration 3, because rooms have no budget field.

## How the Iteration 1 changes went

| Change we promised | What happened |
| --- | --- |
| **Open PRs early and small**: open a draft PR as soon as a story has a first working slice, and aim to have each Must story in review by the end of the first week. | **Partly.** CH-03 was split into #62/#63 and opened on 10 Nov, merged on 13 Nov. But the Must stories landed at the end again: #79 (US-09a) merged on 19 Nov, #83 (US-09b) only became ready for review on 19 Nov, and #86 (US-12) was opened on 19 Nov. Seven of the eleven PRs landed on 18-19 Nov; the last two closed the increment at the end. |
| **Say which shared files a story touches**: list the shared components in the issue when picking a story. | **Not done.** #79 and the layouts PRs (#73-#75) all changed `RoomPlan.tsx` and `RoomDetails.tsx`. The conflict was found in review of #79 and fixed by merging `develop`, not planned in the issue. |
| **Add component tests**: add jsdom and Testing Library and test the interactive components. | **Deferred to Iteration 3.** jsdom and Testing Library were not added; CH-05 (#66) stays open and moves to the next iteration. Plan components are tested with `@react-three/test-renderer` (US-06a, US-09 AT-3), but US-09b's layout and accessibility ATs, and the save/list rendering ATs, are `manual`. |
| **Close issues when the PR is merged**. | **Done.** #30, #69-#72, #81 and the parent #35/#36/#61 closed with their PRs. #31 stayed open until its sub-issue #82 closed; #34 until #86. #72 closed one day after #75 because #84 completed the open flow, which is the honest state. |

## What went well

- **O4 arrived early and end to end.** The layouts API (#73), the save form
  (#74), the saved-layouts list (#75) and the open-with-confirmation flow
  (#84) form a complete save/load loop. US-13 and US-14 closed in Iteration 2,
  one iteration before the plan asked for them.
- **The acceptance gate paid for itself.** The first review of #83 found that
  none of US-09b's five ATs were covered and that the new `add-at` action had
  no tests. CI was red for the right reason, and the PR was fixed before
  merge. That is the behaviour CH-03 was built for.
- **Reviews were substantive.** On #83, Nicolas ran the feature and asked for
  three specific drop tests; João caught that the three-panel layout had to
  leave room for the save form and saved layouts. On #79, João listed exactly
  what to keep when merging `develop`. On #84, Nicolas saved, removed and
  reopened a layout, including the deleted-in-another-tab case.
- **Small changes stayed small.** The Windows path fix (#76) and the Next.js
  security upgrade (#80) each got their own PR instead of riding along with a
  feature.
- **The suite grew with the product.** By #86 the project reported 98 test
  files / 588 tests, with the acceptance report grouped by story and AT.

## What went badly

- **The work was back-loaded again.** Only CH-03 (and the #76 Windows path
  fix) landed before 18 Nov. The last three days carried US-08, all four layout
  slices, US-09a, US-09b and US-12.
- **We divided the issues late.** The stories were only split between us about
  three days into the sprint rather than at planning, which shortened the time
  available for the Must work and contributed to the end-of-iteration crunch.
- **#83 mixed three concerns in one PR.** Drag and drop, the three-panel room
  page and the `/` → `/rooms` redirect are separate changes with separate
  risks. At twelve commits it was not a "small draft PR", and the missing tests
  were only found a little later on.
- **A story assumed data that did not exist.** US-12 AT-5 talked about a room
  budget, but there is no budget in the schema, the API or the room form.
  Nicolas raised it during implementation and the team moved it to #85 on
  19 Nov. This should have been caught when the AT was written.
- **CI capacity ran out at least once.** #76's Definition of Done notes say CI
  had not run because of the Actions limit, so the change was verified locally.
  One PR is a warning, not a crisis, but the release should not depend on an
  unavailable pipeline.
- **The component-test promise was deferred.** Without jsdom/Testing Library,
  the new interactive surfaces (save form, saved-layouts list, three-panel
  layout) still rely on helper tests and manual ATs. CH-05 (#66) moves to
  Iteration 3.

## What we will change in Iteration 3

| Change | How we will know it worked |
| --- | --- |
| **Freeze the Must scope at planning.** A story from a later iteration can only move in through a public cut, written in `stories.md`. | The Iteration 3 milestone matches the Must PRs that merge; no Must story appears without a decision note. |
| **Open each Must PR as a draft by the middle of the iteration, one concern per PR.** | No Must story is first opened for review in the last two days; a PR like #83 is split into layout, drag/drop and routing. |
| **Check every AT against the data model during refinement.** | No AT depends on a field that is not in the schema/API; #85 is the explicit path for the budget. |
| **Ship CH-05 (#66): jsdom + Testing Library, and one component test per new interactive component.** | #66 closes and the number of `manual` ATs in `overrides.json` goes down, starting with US-09b and the layouts list. |
| **Put the shared files in the issue when picking a story.** | Issues name the components they touch; the next layout PR does not discover the conflict in review. |

## Carried into Iteration 3

| Item | Why it is there |
| --- | --- |
| **US-10** Drag and rotate items (#32) | O3 Must; the draft already exposes positions and rotation. |
| **US-11** Collision highlight (#33) | O3 Must; SAT replaces the conservative AABB check. |
| **US-12b** Total against a room budget (#85) | Moved from US-12 AT-5; needs a budget field, API and form. |
| **US-04 / US-05** Edit and delete a room (#26, #27) | The two Should stories cut from Iteration 2. |
| **CH-05** DOM component test harness (#66) | The component-test promise from Iteration 1. |
| **CH-04** Feature-based source tree (#65) | Still in the backlog; not committed to Iteration 3. |
