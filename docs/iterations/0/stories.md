# Stories

## MVP outcomes

These are the milestones the backlog maps to. The full definitions and
the boundaries around them are in [mvp.md](mvp.md).

- **O1 - Room setup:** The user creates a room by defining dimensions and
  a location.
- **O2 - Catalog and stores:** The user explores a furniture catalog,
  sees the nearest stores that stock each item, and adds items to the
  room.
- **O3 - 2D plan:** The user views a 2D floor plan with placed items,
  collision highlights, and running total cost.
- **O4 - Persistence:** The user saves and reloads layouts from storage.
- **O5 - Natural language:** The user describes what they want in
  natural language and gets catalog filters applied.

## Story to outcome map

| Outcome | Stories | Iterations |
| --- | --- | --- |
| **O1** | US-01, US-02, US-03, US-04, US-05, US-06, US-15 | 0: US-01 · 1: US-02, US-03, US-06, US-15 · 2: US-04, US-05 (Should, moved to 3) |
| **O2** | US-07, US-08, US-09, US-17 | 1: US-07 · 2: US-08, US-09 · 4: US-17 |
| **O3** | US-10, US-11, US-12 | 2: US-12 · 3: US-10, US-11, US-12b (#85) |
| **O4** | US-13, US-14 | 2: US-13, US-14 (pulled forward from 3) |
| **O5** | US-16, US-18 | 4 |

Every story has one primary outcome. An outcome can span iterations: O1
starts with US-01 in Iteration 0 and completes with location in
Iteration 1; O3 completes in Iteration 3; O2 and O5 complete in
Iteration 4. O4 completed in Iteration 2, one iteration early.

## Iteration 0 - In scope

One story. UI to data, end to end.

| ID    | Story                                                          | Outcome | Priority |
|-------|----------------------------------------------------------------|---------|----------|
| US-01 | As a user, I can create a room by specifying a name and its  dimensions in cm.  | O1      | Must     |

## Iteration 0 - Public cut

This is the Iteration 0 plan, kept for history. The Iteration 2 public cut
below records where the items that slipped actually went.

Explicitly not done in Iter 0, planned for later:

- List rooms                       → Iter 1
- View room details                → Iter 1
- Edit / delete room               → Iter 2
- 2D plan view of the room         → Iter 1
- Catalog of furniture items       → Iter 1
- Catalog filters (price/tags)     → Iter 2
- Add item to room                 → Iter 2
- Running total cost               → Iter 2
- Save / load layouts              → Iter 3
- Location / geolocation           → Iter 1
- Drag / rotate items              → Iter 3
- Collision highlight              → Iter 3
- LLM-based filters                → Iter 4
- Nearest stores list              → Iter 4
- Store map / navigation           → Vision

## Iteration 2 - Public cut

Delivered in Iteration 2:

- US-08 (filter by max price and tags), US-09a/US-09b (add an item, functional
  and UI polish) and US-12 (running total).
- US-13 and US-14 (save and reload layouts) were planned for Iteration 3 and
  were pulled forward; O4 is complete.
- CH-03a/CH-03b (acceptance tests by story/AT, CI report and regression
  labels) and the Next.js security upgrade (#78).

Explicitly not done in Iter 2, and where they went:

- Edit a room (US-04)          → Iter 3 (Should)
- Delete a room (US-05)        → Iter 3 (Should)
- US-12 AT-5, total against a room budget → US-12b, #85 (Iter 3)
- Drag / rotate items (US-10)  → Iter 3
- Collision highlight (US-11)  → Iter 3
- DOM component test harness (CH-05, #66) → Iter 3
- Feature-based source tree (CH-04, #65)  → backlog

## Full backlog

| ID    | Story                                                              | Outcome | Priority | Iter |
|-------|--------------------------------------------------------------------|---------|----------|------|
| US-02 | As a user, I can see the list of rooms I've created.                | O1      | Must     | 1    |
| US-03 | As a user, I can open a room and see its details.                   | O1      | Must     | 1    |
| US-04 | As a user, I can edit a room's name and dimensions.                 | O1      | Should   | 2    |
| US-05 | As a user, I can delete a room.                                     | O1      | Should   | 2    |
| US-06 | As a user, I can see a 2D plan view of the room.                    | O1      | Must     | 1    |
| US-07 | As a user, I can browse catalog items filtered by category.         | O2      | Must     | 1    |
| US-08 | As a user, I can filter items by maximum price and tags.            | O2      | Must     | 2    |
| US-09 | As a user, I can add a selected item to the current layout.         | O2      | Must     | 2    |
| US-10 | As a user, I can drag and rotate items on the 2D floor plan.        | O3      | Must     | 3    |
| US-11 | As a user, I can see colliding items highlighted in red.            | O3      | Must     | 3    |
| US-12 | As a user, I can view the running total cost of placed items.       | O3      | Must     | 2    |
| US-13 | As a user, I can save a layout with a custom name.                  | O4      | Must     | 3    |
| US-14 | As a user, I can reload a previously saved layout.                  | O4      | Must     | 3    |
| US-15 | As a user, I can set my location (city or browser geolocation).     | O1      | Must     | 1    |
| US-16 | As a user, I can type "Nordic bedroom under €500" and get filters.  | O5      | Must     | 4    |
| US-17 | As a user, I can see the stores nearest to my room's location that stock an item. | O2      | Must   | 4    |
| US-18 | As a user, if my sentence can't be understood, I'm told and can still filter manually. | O5      | Must     | 4    |

## Iteration 0 slice

US-01 only. Create a room, persist it, show confirmation.