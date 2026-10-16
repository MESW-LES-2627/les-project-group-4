# Definition of Done

> FurniMi · LES – Team D · FEUP 2026/27

This is the shared bar for "done". It has two gates: one for a single change (an issue / PR), and one for an iteration (a tagged increment).
A change is done when it is written, verified, reviewed, and reproducible by someone else.

Nothing here replaces the acceptance criteria of a story; it is what applies _on top_ of every story before it can be called done.

## Per change (issue / PR)

1. **Code is written and peer reviewed.** At least one other team member has read the change and approved it. A PR from a single author with no
   review is not done, no matter how small.

2. **It matches the story.** The acceptance criteria of the issue are met and the change traces to an MVP outcome (O1–O4).

3. **Green locally.** `./mvnw test`, `npm run build`, and `npx oxlint` all pass, and the backend boots with `ddl-auto=validate` (the entity matches
   the Flyway schema).

4. **It is in history.** Merged to `main` via a reviewed PR.

5. **Team-done.** Any teammate could pull the change and reproduce it without the author present. If only the author can open it, it is not
   team-done.

## Per iteration (tagged increment)

1. **It runs from the tag.** From a clean clone following only `README.md`: `docker compose up -d db`, run the backend, run the frontend — from the
   `iter-N` tag, not only on one laptop.

2. **A non-author ran the walkthrough.** The end-to-end flow was run by someone who did not write that code.

3. **Scope is honest.** Every _Must_ story for the iteration is done; _Should/Could_ items are either done or explicitly moved to the public
   cut in `stories.md`.

4. **`CLAIM.md` has real permalinks.** Tag, compare link, pipeline, artefacts — no `TBD`, and no score.

5. **Retrospective and AI log are filled** for the iteration.
