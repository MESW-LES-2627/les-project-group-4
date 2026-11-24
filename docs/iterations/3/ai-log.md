# AI Log - Iteration 3

> FurniMi · LES - Team D · FEUP 2026/27

Same rule as the previous iterations: AI was an assistant, not an author. Every
suggestion was read, changed where needed, run locally and reviewed by another
team member before it was merged. Each member records their own.

## Tool

| Tool | Who | What it was used for |
| --- | --- | --- |
| Claude (Claude Code) | João | US-11 split and US-11a collision model (#97), help reviewing #94. |

## João (Claude Code)

### What I used it for

- **Splitting US-11 (#33).** Proposed splitting it into US-11a (collision
  model, 5 pts, #97) and US-11b (highlight on the plan, 3 pts, #98), so the
  model can be merged and tested before the UI, which touches the same files
  as US-10 (#32). I checked the split against the estimation scale and ran the
  script that created the issues and updated the board.
- **Collision model (US-11a).** First version of `collision.ts`: exact overlap
  with the separating axis theorem on the rotated footprints (touching edges do
  not count) and out-of-bounds reusing `isInsideRoom`, plus the unit and
  acceptance tests. I read the geometry, checked the rotated cases by hand and
  ran typecheck, lint, tests and `acceptance:check` locally.
- **Reviewing #94 (CH-05 DOM harness, Nicolas).** Checked the new commits
  against Francisca's review comments and drafted my review text.

### What I checked or changed myself

- The overrides: US-11 AT-4/AT-5 now point to US-11a and AT-1..AT-3 to US-11b,
  and US-06b/AT-5 (item-vs-item overlap) is no longer deferred.
