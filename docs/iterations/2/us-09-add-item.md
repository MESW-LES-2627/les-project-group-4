# US-09 — Add a selected item to the layout

> FurniMi · LES - Team D · FEUP 2026/27

## Where things live

| Concern | File |
| --- | --- |
| Default placement | `src/lib/layout/placement.ts` |
| Draft state per room | `src/lib/layout/draft.ts` |
| Session provider and hook | `src/components/layout/DraftLayoutsProvider.tsx`, `src/hooks/useDraftLayouts.ts` |
| Plan and placed-items list | `src/components/plan/RoomPlan.tsx`, `PlacedItemsList.tsx` |
| Catalog surfaces | `src/components/catalog/RoomCatalog.tsx`, `AddToLayoutButton.tsx`, `CurrentRoomBanner.tsx` |
| "Doesn't fit" message | `src/components/catalog/PlacementError.tsx` |

The room page shows the catalog panel (`RoomCatalog`) under the plan, so items
can be added without leaving the room. `/catalog` adds to the last room opened in
the session (`RegisterCurrentRoom`), which is why it can say "Adding to …".

## Default placement

- Units are centimetres. The origin is the room's top-left corner, x grows
  right, y grows down, and `(xCm, yCm)` is the footprint's **centre** — the
  contract is in `src/lib/geometry/plan.ts`.
- New items are packed against the **top wall**, left to right, then row by row
  downwards. The wall margin is **0** and touching a wall or a neighbour is
  allowed. Existing items are never moved or re-flowed.
- Candidate positions are the walls plus the bottom and right edges of the items
  already placed; the first free spot wins. A gap left by a dragged item is
  reused (US-10 can rely on that).
- **Upright (0°) is tried everywhere before 90°.** A quarter turn is only used
  when nothing upright fits.
- Overlap uses axis-aligned bounding boxes: exact at 0°/90°, conservative at any
  other angle. Rotated item-vs-item collision detection (SAT) belongs to US-11.
- `placeInRoom` returns `null` when nothing fits. The draft then keeps
  `DOES_NOT_FIT_MESSAGE` for that room and adds nothing; the UI shows it in a
  destructive alert that clears on the next successful add or remove.

## Draft contract

`useDraftLayouts()` is client-only and provided once, in the root layout.

| Member | Purpose |
| --- | --- |
| `currentRoom` / `setCurrentRoom` | Last room opened; the catalog page adds to it. Never cleared on unmount. |
| `itemsFor(roomId)` | That room's placed items. Empty rooms share one stable empty array. |
| `errorFor(roomId)` | AT-5 message for that room, or `null`. |
| `addItem(roomId, room, item)` | Generates the instance id with `crypto.randomUUID()`, places the item and snapshots its price. |
| `removeItem(roomId, id)` | AT-4. |
| `replaceItems(roomId, items)` | US-13/US-14: put a loaded layout into the draft. |
| `dismissError(roomId)` | Dismiss the AT-5 alert. |

- State is keyed by room id, so rooms never share items and switching rooms keeps
  each draft.
- State lives above the routes, so it survives client navigation but **not a
  reload**. That is deliberate: this is an unsaved layout; saving is US-13.
- `priceCents` is copied from the catalog when the item is added, matching what
  US-13 stores with a saved layout.

## What this story does not own

- **Move/rotate** on the plan: US-10.
- **Rotated collision highlight**: US-11 (SAT).
- **Running total**: US-12 (#34). The draft exposes everything the total needs
  (`priceCents` per item); AT-4's total clause is checked at state level in the
  acceptance test with a local sum.
- **Saving and reloading layouts**: US-13/US-14, via `replaceItems`.

## Acceptance tests

`tests/acceptance/US-09-add-item/` covers AT-1 to AT-5. AT-6 (drafts survive
navigation) is `manual` in `tests/acceptance/overrides.json` until CH-05 (#66)
adds a DOM harness.
