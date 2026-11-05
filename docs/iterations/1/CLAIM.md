# CLAIM - Iteration 1

> FurniMi · LES – Team D · FEUP 2026/27

This is the entry point for Iteration 1 (23 Oct – 6 Nov 2026). The
iteration completes O1, starts O2, and ships the 2D plan setup so the
visualiser is de-risked early.

## Documents in this iteration

The scope and process contracts did not change in this iteration, so
they stay in the Iteration 0 folder:

| Document                      | What it answers                                                  |
| ----------------------------- | ---------------------------------------------------------------- |
| [mvp.md](../0/mvp.md)         | The scope contract: MVP outcomes O1–O5 and what is out of scope. |
| [stories.md](../0/stories.md) | The backlog and the public cut.                                  |
| [DoD.md](../0/DoD.md)         | The shared bar for "done", per change and per iteration.         |
| [ci.md](ci.md)                | What CI checks and how staging and production deploy.            |
| [retro.md](retro.md)          | What went well, what went badly, and what changes in Iteration 2. |
| [ai-log.md](ai-log.md)        | Which AI tools were used and where the model was wrong.          |

## Board

Screenshots are taken from the same GitHub Project view (grouped by **Status**) at the start and end of the
iteration.

| Before the iteration                          | After the iteration                         |
| --------------------------------------------- | ------------------------------------------- |
| ![Board before Iteration 1](board/before.png) | ![Board after Iteration 1](board/after.png) |

## Permalinks

- Production: TBD (auto-deploys when `develop` is merged into `main` at the end of the iteration)
- Staging: <https://furnimi-staging.vercel.app/>
- Pipeline: [CI](https://github.com/MESW-LES-2627/les-project-group-4/actions/workflows/ci.yml) runs on every PR and on pushes to `develop` and `main`; [Deploy](https://github.com/MESW-LES-2627/les-project-group-4/actions/workflows/deploy.yml) deploys staging from `develop` and production from `main`
- Tag: TBD
- Compare with previous tag: [`iter-0...iter-1`](https://github.com/MESW-LES-2627/les-project-group-4/compare/iter-0...iter-1) (once `iter-1` exists)
