# AI Log - Iteration 2

> FurniMi · LES - Team D · FEUP 2026/27

Same rule as Iterations 0 and 1: AI was an assistant, not an author. Every
suggestion was read, changed where needed, run locally and reviewed by another
team member before it was merged. This entry covers Francisca's use of AI; each
member records their own.

## Tool

| Tool | Who | What it was used for |
| --- | --- | --- |
| OpenCode (DeepSeek V4.1 Flash) | Francisca | CH-03a/CH-03b (#62, #63), US-09a (#81), US-09b (#82), the Next.js security upgrade (#80) and the Iteration 2 docs. |

## What I used it for

- **Acceptance structure and reporting (CH-03a, CH-03b).** First versions of
  the `unit`/`acceptance` Vitest projects, the `US`/`AT` tags and `strictTags`,
  the registry generator and `acceptance:check`, the grouped report, the
  merge-base comparison and the dedicated CI jobs. I ran every command on the
  real issues, changed the gate to be strict by default and drift-warn on
  pushes, and reviewed the diffs before #64 and #67.
- **Adding an item (US-09a).** First versions of the shelf packing in
  `placement.ts`, the per-room draft reducer and provider, the room catalog
  panel, the placed-items list and the acceptance tests. I reviewed and
  adapted it, and handled the `develop` merge that #79 needed after the layouts
  PRs landed.
- **Add-item UI polish (US-09b).** First versions of the drag hit-testing
  through the plan camera, the `add-at` placement with auto-placement fallback,
  the three-panel room page and the `/` → `/rooms` redirect. The first review
  of #83 found the missing AT coverage and drop tests; I added them before the
  PR left draft.

## One place the model was wrong

**What the model produced.** In #83 it produced a working drag-and-drop room
page: the item landed where the cursor was, the three panels looked right, and
the `/` redirect worked when tried by hand. It also produced no tests for the
new `add-at` action and none of US-09b's five ATs were covered.

**What was wrong.** "It works when I drag it" is not the same as covered. The
PR said `Closes #82`, so the traceability gate correctly went red: five ATs
were uncovered and the drop logic had no test that would notice a regression.
The visual result hid the missing verification.

**What we changed.** Three reducer tests for `add-at` (exact drop, fallback
when the drop is outside or overlaps, "doesn't fit" when there is no space),
one acceptance test for US-09b AT-3, and `manual` overrides for the four ATs
that need a DOM/browser harness, each pointing at CH-05 (#66). Then the
registry was synced.

**Why it matters.** The gate turned a hand-tested demo into something that
matches our Definition of Done. For UI work, the question is not "does it look
right?" but "which AT proves it, and what test would fail if this broke?".

## What I checked before merging

- `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`.
- `npm run acceptance:check -- --issue <n>` for the story the PR closes.
- **A manual walkthrough of every Iteration 2 change**, on the PR branch before
  it merged:
  - **US-08 filters (#77):** max price at the boundary, one tag, two tags in
    the same facet (OR), style + room type (AND), category + price, clear
    filters, and two rapid changes where the older response must not win.
  - **US-09a add/remove (#79):** add from a catalog card and from `/catalog`,
    see the item packed against the top wall, its price in the placed-items
    list, remove it, an oversized item showing "Doesn't fit this room", the
    draft surviving client navigation, and the draft clearing on reload.
  - **US-09b room editor (#83):** drag a card onto the plan and check it lands
    at the cursor; drop outside the room and on top of another item and check
    the auto-placement fallback; the "Add" button still works; the three
    panels are placed items / plan / catalog; they stack in that order below
    `lg`; item labels are visible; panel headers stay fixed while the lists
    scroll; saved-layout thumbnails render; `/` lands on `/rooms` and
    `/rooms/new` opens the create form.
  - **US-12 total (#86):** the total appears after adding, grows by the item's
    price, shrinks after removing, is formatted in EUR, and uses the stored
    prices rather than the current catalog. No budget is shown (moved to #85).
  - **US-13 / US-14 layouts (#73, #74, #75, #84):** save with a name, blank
    name, duplicate name, confirmation; list by name and item count; empty
    state; open with replace confirmation and cancel; deleted/missing layout
    message; delete with confirm/cancel; the list survives a reload.
  - **CH-03 (#64, #67):** both Vitest projects run; `acceptance:check` fails
    an uncovered AT and passes a covered one; the grouped report names the
    story; the base comparison labels a regression; the registry is in sync.
  - **Security (#78, #80):** `npx next --version` is 16.4.6 and the build no
    longer prints the advisory.
