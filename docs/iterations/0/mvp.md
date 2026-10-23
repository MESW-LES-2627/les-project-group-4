# MVP

> FurniMi · LES – Team D · FEUP 2026/27

This document is the scope contract for the MVP. If something is not in
**MVP Outcomes**, it is not in the MVP. If something is cut from an
iteration, it must appear in the public cut in
[stories.md](stories.md), not disappear.

**Out of scope** and **cut** are different: out of scope means "not in
the MVP at all"; a cut is deferred, either to a later iteration or
explicitly to Vision.

## Who it's for?

Someone moving into a new home, or rearranging a room they already
have, who wants to know **what fits** and **what it will cost** before
buying anything.

Today they juggle a tape measure, store websites and guesswork, and
only find out at delivery that the sofa blocks the door or that the
room went over budget. FurniMi puts real dimensions and real prices in
one plan.


## MVP Outcomes

O1: The user creates a room by defining dimensions and a location.

O2: The user explores a furniture catalog, sees the nearest stores
that stock each item, and adds items to the room.

O3: The user views a 2D floor plan with placed items, collision
highlights, and running total cost.

O4: The user saves and reloads layouts from storage.

O5: The user describes what they want in natural language and gets
catalog filters applied.

## Out of scope (Vision)

[vision.md](vision.md) describes where FurniMi can go after the MVP.
That direction is not a backlog: nothing below is scheduled, estimated,
or promised. Each item is listed with what the MVP does instead, so the
difference is visible in the product.

| Vision direction | Deliberately not in the MVP | What the MVP does instead |
| --- | --- | --- |
| **3D room customisation** | 3D engine, walkthrough, editable wall colours, floors and lighting, 3D furniture models | 2D SVG floor plan; furniture shown as true-to-scale footprints |
| **Collaborative planning** | Accounts, invitations, shared rooms, real-time co-editing, comments, presence | Single-user layouts; no login, sharing or comments |
| **Layouts from a sentence** | Autonomous LLM layout generation, auto-placement, conversational editing | O5 only maps one sentence to catalog filters; the user still chooses and places every item |
| **Live stores, maps and routes** | Live stock and prices, store map, route and pickup planning, live store feeds | O2 uses a seeded store list sorted by distance; prices are catalog prices, not live prices |

**Enablers deliberately not built.** The four directions above depend on
capabilities the MVP does not have: user accounts and authentication,
real-time sync, a 3D engine, autonomous LLM generation, and live store
data. Adding any of them is a new product decision, not an
implementation detail.

**Also outside the MVP:**

- Checkout, payments, orders, reservations and delivery tracking —
  FurniMi plans a room; the user buys elsewhere.
- Multi-room or whole-home planning, CAD drawings and plan export — the
  MVP plans one room.
- AR or photo-based room measurement, and floor-plan import — dimensions
  are typed by the user.
- Native mobile apps, browser extensions, and store-owner or admin
  portals — the MVP is one web app with seeded data.

**Boundary rules:**

- If an outcome needs accounts, real-time sync, 3D, autonomous
  generation or live store data, it is not MVP.
- Future work in `vision.md` is not a commitment and is not in the
  backlog.
- A missing feature is not a cut unless it is written in `stories.md`.
- O5 is scheduled with O2 and O3 in Iteration 2. It stays sentence →
  filters only; it never becomes layout generation.

## Definition of Done

The shared gates for a single change and for an iteration are in
[DoD.md](DoD.md) and apply on top of every story. In short: reviewed by
a non-author, green locally, merged to `main`, reproducible from the
tag, and verified by someone who did not write it.

The MVP is done when **all** of the following are true:

1. **O1–O4 are demonstrable end to end from the final `iter-N` tag.**
   A user can create a room, browse the catalog and add items, see
   which seeded nearby stores stock them, see the 2D plan with
   collisions and total cost, and save/reload a layout. This runs
   through UI → REST → PostgreSQL, not against a mock.

2. **O5 is demonstrated end to end.** A sentence that matches the
   catalog becomes filters (US-16); a sentence that cannot be understood
   is rejected with a message and manual filtering still works (US-18).
   O5 stays sentence → filters only and is never described as layout
   generation.

3. **Persistence is real.** Rooms, layouts and placed items survive a
   backend restart; reload returns the same data; totals are computed
   from stored prices, not hardcoded.

4. **Every Must story is done, and every gap is public.** All Must
   stories for the final iteration pass, and everything deferred is
   listed in [stories.md](stories.md). No silent cuts.

5. **A non-author can run it from a clean clone.** Following only
   `README.md`, from the tag and not only on one laptop, they bring up
   the database, backend and frontend and complete the walkthrough.
   Any teammate can demo it without the author present.

6. **Each outcome has a check that would fail if it broke.**
   Iteration 0 uses a documented walkthrough; from Iteration 1,
   automation must appear and grow (`./mvnw test`, `npm run build`,
   `npx oxlint`, plus outcome-level tests).

7. **It is in history.** Every change was peer-reviewed and merged to
   `main` before the tag — not a Friday dump and not work that exists
   only on one laptop.

8. **Nothing is faked.** Seeded catalog and store data is labelled as
   seeded; there is no pretend LLM, no live-store claim, and no
   collision check that ignores real dimensions.

9. **The iteration record is complete.** `CLAIM.md` has real
   permalinks (tag, compare, pipeline, artefacts) and no score, and the
   retrospective and AI log are filled in.

## Iteration 0 scope cut

**Iteration 0 is the walking skeleton.** It contains exactly one story,
US-01, and proves that one change can travel from the UI to PostgreSQL
and back. It also creates the room that later outcomes attach to. It is
not a reduced MVP, and it does not complete O1: location is still
missing.

### In Iteration 0

| Story | What ships | Outcome | Done when |
| --- | --- | --- | --- |
| US-01 | Create a room with a name, width and length in cm; validate input; persist it; return the created room | O1 (partial) | From the tag, the form creates a row in `room` and shows the saved room; invalid input is rejected; a non-author has run the walkthrough |

The vertical slice is: form → REST endpoint → service → repository →
PostgreSQL → response → confirmation in the UI.

### Out of Iteration 0

| Deferred | Moved to | Reason |
| --- | --- | --- |
| Room list, details, edit and delete (US-02–05) | Iter 1 | Not needed to prove the first vertical slice |
| 2D preview of the room (US-06) | Iter 1 | Depends on a room existing |
| Catalog browse and filters (US-07–08), add item (US-09) | Iter 1 | First slice of O2 |
| Running total (US-12) | Iter 1 | Needs placed items |
| Save and reload layouts (US-13–14) | Iter 1 | Needs items and a total worth saving |
| Drag/rotate (US-10) and collision highlight (US-11) | Iter 2 | O3 needs the plan and placement model first |
| Location: city or browser geolocation (US-15) | Iter 1 | Completes O1; not needed for the first create flow |
| Nearest stores list (US-17) | Iter 2 | Completes O2; live stock, maps and routes stay in Vision |
| O5 sentence → filters (US-16, US-18) | Iter 2 | Must stories; filters only, with a manual fallback |
| 3D, collaboration, generated layouts, live stores/maps/routes | Vision | Out of the MVP entirely |

### What Iteration 0 does not claim

- O1 is not complete: a room has no location yet.
- O2–O4 have no user-visible progress. The `item` table in the schema
  is groundwork, not a catalog feature.
- There are no stores, totals, 2D plan, save/load or LLM behaviour yet.
- The only evidence for Iteration 0 is the US-01 walkthrough (run by a
  non-author) and the green build.

### Why this cut is the right one

- It is a vertical slice, not a layer: form → API → service →
  repository → database → response.
- It creates the `room` aggregate that every later story needs.
- It uses none of the future enablers: no accounts, no LLM, no 3D, no
  live data.
- It makes the next cut obvious: Iteration 1 adds room management and
  the catalog on top of a room that already persists.

Any change to this scope must update this file and
[stories.md](stories.md) in the same pull request.
