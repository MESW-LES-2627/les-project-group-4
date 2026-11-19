# CLAIM — Iteration 2

Team: FurniMi — Team D (LES, FEUP 2026/27)

Tag: `iter-2`

Previous tag: [`iter-1`](https://github.com/MESW-LES-2627/les-project-group-4/tree/iter-1)

This file lives on the tagged commit at `docs/iterations/2/CLAIM.md` and is the
entry point for the Iteration 2 review. Iteration 2 advances O2 with price/tag
filters (US-08) and adding items to the layout (US-09), starts O3
with the running total (US-12), and pulls O4 forward: layouts can be saved,
listed, opened and deleted (US-13, US-14). It also replaces the ad-hoc test
layout with the US/AT acceptance registry and a CI report that names the story
that broke (CH-03). O2 stays open for US-17 (nearest stores) in Iteration 4.

---

## Required permalinks

Use links that work on tag `iter-2`. If something does not exist yet, write
`none yet` — do not paste a link that 404s.

| What                      | Link                                                                                                                                                                              |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MVP                       | [mvp.md](../0/mvp.md)                                                                                                                                                             |
| Vision                    | [vision.md](../0/vision.md)                                                                                                                                                       |
| Definition of Done        | [DoD.md](../0/DoD.md)                                                                                                                                                             |
|                           |                                                                                                                                                                                   |
| This tag (`iter-2`)       | [releases/tag/iter-2](https://github.com/MESW-LES-2627/les-project-group-4/releases/tag/iter-2)                                                                                   |
| Compare with `iter-1`     | [compare/iter-1...iter-2](https://github.com/MESW-LES-2627/les-project-group-4/compare/iter-1...iter-2)                                                                          |
|                           |                                                                                                                                                                                   |
| Production                | [furnimi-production.vercel.app](https://furnimi-production.vercel.app/)                                                                                                           |
| Staging                   | [furnimi-staging.vercel.app](https://furnimi-staging.vercel.app/)                                                                                                                 |
|                           |                                                                                                                                                                                   |
| CI/CD Pipeline            | [CI](https://github.com/MESW-LES-2627/les-project-group-4/actions/workflows/ci.yml) · [Deploy](https://github.com/MESW-LES-2627/les-project-group-4/actions/workflows/deploy.yml) |
|                           |                                                                                                                                                                                   |
| Stories in this increment | [Iteration 2 milestone](https://github.com/MESW-LES-2627/les-project-group-4/milestone/3)                                                                                         |
|                           |                                                                                                                                                                                   |
| Retrospective             | [retro.md](retro.md)                                                                                                                                                              |
| AI log                    | [ai-log.md](ai-log.md)                                                                                                                                                            |
| Board, before vs after    | [board-comparison.md](board-comparison.md)                                                                                                                                        |
| CI changes this iteration | [ci.md](ci.md)                                                                                                                                                                    |
| Deployment                | [deployment.md](../1/deployment.md) — unchanged this iteration                                                                                                                    |

## What this increment contains

| Story / change | Outcome | What shipped | Issues / PRs |
| --- | --- | --- | --- |
| **US-08** Filter by max price and tags | O2 | `?maxPrice=`, `?style=`, `?room=` on `/api/items` and `/catalog`; OR within a facet, AND across facets; newest response wins | #30 · #77 |
| **US-09a** Add a selected item | O2 | Default top-wall placement, draft state per room, add/remove, "doesn't fit" alert | #81 · #79 |
| **US-09b** Add-item UI polish | O2 | Drag from the catalog onto the plan, three-panel room page, `/` lands on `/rooms` | #82 · #83 |
| **US-12** Running total | O3 | Sum of the prices stored on the placed items, in EUR | #34 · #86 |
| **US-13 / US-14** Save and reload layouts | O4 | Layouts API, save form, saved-layouts list, open with replace confirmation, delete | #69–#72 · #73, #74, #75, #84 |
| **CH-03a / CH-03b** Acceptance traceability | — | `unit`/`acceptance` Vitest projects, US/AT tags, registry, grouped report, base-commit regression labels | #61–#63 · #64, #67, #76 |
| **Security** Next.js upgrade | — | 16.4.2 → 16.4.6 for a published advisory | #78 · #80 |

US-04 (edit room) and US-05 (delete room) were the two Should stories planned
for this iteration. They were not started and are moved to Iteration 3. The
budget half of US-12 (AT-5) became **US-12b, #85**, also in Iteration 3, because
rooms have no budget field yet.

## Final PRs in the increment

| PR | Closes | What it added |
| --- | --- | --- |
| [#83](https://github.com/MESW-LES-2627/les-project-group-4/pull/83) | #82 (US-09b) | Drag from the catalog onto the plan, the three-panel room editor, saved-layout previews and the `/` → `/rooms` redirect |
| [#86](https://github.com/MESW-LES-2627/les-project-group-4/pull/86) | #34 (US-12) | The running total of the placed items, in EUR |

Both are part of `develop`, and the Iteration 2 milestone is complete. #34 and
#82 close through their PRs. GitHub may not close the parent #31 when its last
sub-issue (#82) closes, so close #31 by hand if it is still open when the
milestone is checked.

## Closeout checklist

- [ ] Open and merge the release PR `develop` → `main` (this applies the
      production migration and deploys).
- [ ] Tag the release commit `iter-2`; the links above start working then.
- [ ] Capture the after board, add `board/after.png`, and fill the after
      counts in [board-comparison.md](board-comparison.md).
- [ ] Run the clean-clone walkthrough from the tag
      (`npm install`, `npm run dev`) on a machine that is not the author's.
- [ ] Check the production and staging URLs, and the CI/deploy runs for the
      release PR.
- [ ] Delete this checklist once the tag exists.
