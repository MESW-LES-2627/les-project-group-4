# Estimation

> FurniMi · LES - Team D · FEUP 2026/27

Every issue carries **one estimate**: a Fibonacci number of points on the
[project board](https://github.com/orgs/MESW-LES-2627/projects/6). The board's
`Estimate` field is the source of truth and the only field entered by hand.
`Size` is **derived** from the estimate for scanning and is never picked
separately, so a card cannot be an "M (5)" on one day and an "M (8)" on the
next.

## Scale

| Points | Shows as | Typical change                                        |
| :----: | :------: | ----------------------------------------------------- |
| 1, 2   | XS       | one file, one test, a config or copy change           |
| 3      | S        | one endpoint or one component with its tests          |
| 5, 8   | M        | one story slice across a few files                    |
| 13     | L        | the largest card committed to an iteration            |
| 21, 34 | XL       | **too big — split before it enters an iteration**     |

The non-linearity is deliberate: 13 → 21 is a real jump in uncertainty, and the
scale refuses to pretend that 15 and 16 are different sizes.

Rules:

- **Only leaf issues carry points.** A parent with sub-issues (US-06, US-09,
  US-13, US-14, CH-03) carries no estimate, or the rollup is counted twice.
  It also has no derived Size.
- **13 is the ceiling for a single card.** Anything estimated at 21 is split,
  the way US-06, US-09, US-13 and US-14 were split into `a`/`b` slices.
- **Points are size and risk, not hours.** The rate below is for sanity checks,
  not for turning points into a timesheet.

## Calibration

Points were reconstructed from the delivered work and are only comparable with
each other, not with another team's scale. Iterations 0–2 happened to land on
Fibonacci values already, so switching to this scale did not re-estimate them.

| Iteration | Working days | Devs | Points | Points/day | Verdict |
| --------- | :----------: | :--: | :----: | :--------: | ------- |
| 0         | 4            | 4    | 13     | 3.3        | too little on paper: the stack migration was never estimated |
| 1         | 10           | 4→3  | 70     | 7.0        | sufficient: everything shipped, but late |
| 2         | 10           | 3    | 87     | 8.7        | too much: two Should stories cut, end-of-iteration crunch |

Iteration 2 reconciles as **68 planned − 10 cut + 26 pulled forward + 3
unplanned = 87**.

## What to plan

- **A normal iteration (10 working days, 3 devs) is 60–70 points.** 75 is the
  ceiling, below 55 is slack. The sustainable rate is **6.5–7.0 points per
  working day**; 8.7/day is the warning light, not a target.
- **Scale by usable working days.** Do not count the release day, public
  holidays or the day after a release as feature days.
- **Keep 10–15% unallocated** for reviews, CI outages and the unexpected fix
  (#78, #89 in Iteration 2).

For Iteration 3 (7 usable working days): **42–48 points**, commit 45.

## How to use it

1. Estimate privately with the sequence, then compare. If two people differ by
   more than one step (say 5 vs 13), discuss the scope instead of averaging.
2. Re-estimate at the close and record planned vs delivered in the retro.
3. If delivered exceeds planned by 20% for two iterations, the estimates are
   too small; below 80%, they are too large.
4. If a card reaches 21, stop and split it. A 21-point card in an iteration is
   a schedule risk, not a big task.
