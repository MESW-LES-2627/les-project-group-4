# FurniMi - Vision

## Vision statement

A world where furnishing a room never ends in: "it doesn't fit" or "I spent too much".
FurniMi lets anyone plan a space before buying; real dimensions, real prices, real 
stores nearby, and a 2D plan you can drag around until it feels right.

## Long-term direction

> Everything in this section is future work. None of it is committed to any
> iteration; it describes where the product could go once the MVP is solid.

In the long run, FurniMi grows from a planning tool into a full planning assistant:

- **3D room customisation** - walk through the room in 3D, change wall colours,
  floors and lighting, and see furniture at true scale instead of as 2D footprints.
- **Collaborative planning** - share a room with flatmates, a partner or a designer,
  edit the same layout together and comment on choices.
- **Layouts from a sentence** - describe the room you want ("a cosy Nordic bedroom
  for under €500, with space for a desk") and get a complete suggested layout
  that already fits the room and the budget.
- **Live stores, maps and routes** - go beyond the MVP's list of nearest stores:
  live stock and prices from each store, the stores on a map, and a route to
  pick everything up.

These features depend on things the MVP deliberately does not build: user accounts,
real-time sync, a 3D engine, autonomous LLM generation and live store data.

## The MVP is honest

The MVP does not try to be a small version of everything above. It is a small
catalog, a 2D plan, and persistence you can trust - outcomes O1 to O5 in
[mvp.md](mvp.md):

- create a room with real dimensions and a location (O1);
- browse a furniture catalog, see the nearest stores that stock each item,
  and add items to the room (O2);
- see a 2D floor plan with collisions highlighted and a running total cost (O3);
- save and reload layouts (O4);
- describe what you want in a sentence and get catalog filters applied (O5).

O5 is the closest the MVP gets to "layouts from a sentence": a sentence becomes
catalog filters, never a generated layout. The stores in O2 are a list of
seeded stores sorted by distance, not a map.