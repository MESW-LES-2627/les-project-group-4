# MVP - Locked at end of Iteration 0

## Who it's for?

Someone moving into a new room, or rearranging an existing one, who
wants to know what fits and how much it costs before buying.

## MVP Outcomes

O1: The user creates a room by defining dimensions and a location.

O2: The user explores a furniture catalog and adds items to the room.

O3: The user views a 2D floor plan with placed items, collision
highlights, and running total cost.

O4: The user saves and reloads layouts from storage.

O5 (stretch, Iter 2+): The user describes what they want in natural
language and gets catalog filters applied.

## Out of scope (Vision)

- 3D rendering
- Autonomous LLM layout generation
- Real-time store maps / geo-navigation
- Multi-user collaboration
- User authentication

## Definition of Done

1. It runs on the tag, not only on one laptop.

2. It matches an MVP outcome, or an explicit public cut.

3. A check exists that would fail if the change broke.
(Iter 0: a walkthrough is enough. From Iter 1: automation must
appear and grow.)

4. The change is in history on the tag — not a Friday dump.

5. Any of us could open it. If only the author can, it is not
team-done.

## Iter 0 scope cut

- Only O1's "create a room" is in Iter 0.

- Everything else (list, details, edit, delete, preview) → Iter 1.

- Catalog and items → Iter 1.

- 2D plan with drag, rotation, collision → Iter 1-2.
- Location on the room → Iter 2.
- LLM → Iter 2+.
- Stores nearby → Vision.