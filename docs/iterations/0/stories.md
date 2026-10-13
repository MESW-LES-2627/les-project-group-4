# Stories

## Iteration 0 - In scope

One story. UI to data, end to end.

| ID    | Story                                                          | Outcome | Priority |
|-------|----------------------------------------------------------------|---------|----------|
| US-01 | As a user, I can create a room by specifying a name and its  dimensions in cm.  | O1      | Must     |

## Iteration 0 - Public cut

Explicitly not done in Iter 0, planned for later:

- List rooms                       → Iter 1
- View room details                → Iter 1
- Edit / delete room               → Iter 1
- 2D preview of the room (SVG)     → Iter 1
- Catalog of furniture items       → Iter 1
- Add item to room                 → Iter 1
- Save / load layouts              → Iter 1
- Location / geolocation           → Iter 1
- LLM-based filters                → Iter 3+
- Nearby stores map                → Vision

## Full backlog

| ID    | Story                                                              | Outcome | Priority | Iter |
|-------|--------------------------------------------------------------------|---------|----------|------|
| US-02 | As a user, I can see the list of rooms I've created.                | O1      | Must     | 1    |
| US-03 | As a user, I can open a room and see its details.                   | O1      | Must     | 1    |
| US-04 | As a user, I can edit a room's name and dimensions.                 | O1      | Should   | 1    |
| US-05 | As a user, I can delete a room.                                     | O1      | Should   | 1    |
| US-06 | As a user, I can see a 2D preview of the room (SVG).                | O1      | Should   | 1    |
| US-07 | As a user, I can browse catalog items filtered by category.         | O2      | Must     | 1    |
| US-08 | As a user, I can filter items by maximum price and tags.            | O2      | Must     | 1    |
| US-09 | As a user, I can add a selected item to the current layout.         | O2      | Must     | 1    |
| US-10 | As a user, I can drag and rotate items on the 2D floor plan.        | O3      | Must     | 2    |
| US-11 | As a user, I can see colliding items highlighted in red.            | O3      | Must     | 2    |
| US-12 | As a user, I can view the running total cost of placed items.       | O3      | Must     | 1    |
| US-13 | As a user, I can save a layout with a custom name.                  | O4      | Must     | 1    |
| US-14 | As a user, I can reload a previously saved layout.                  | O4      | Must     | 1    |
| US-15 | As a user, I can set my location (city or browser geolocation).     | O1      | Must     | 2    |
| US-16 | As a user, I can type "Nordic bedroom under €500" and get filters.  | O5      | Should   | 3+   |
| US-17 | As a user, I can see nearby stores stocking the selected items.     | Vision  | Could    | -    |

## Iteration 0 slice

US-01 only. Create a room, persist it, show confirmation.