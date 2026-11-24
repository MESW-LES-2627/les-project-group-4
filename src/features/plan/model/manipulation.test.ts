import { describe, expect, it } from "vitest";

import { isInsideRoom } from "@/features/plan/model/geometry";
import type {
  Placement,
  Point,
  RoomSize,
  Size,
} from "@/features/plan/model/geometry";

import {
  clampPlacementToRoom,
  dragPlacement,
  rotatePlacement,
} from "./manipulation";

const room: RoomSize = { widthCm: 300, lengthCm: 200 };
const sofa: Size = { widthCm: 100, depthCm: 50 };

function placed(xCm: number, yCm: number, rotationDeg = 0): Placement {
  return { xCm, yCm, rotationDeg };
}

describe("clampPlacementToRoom", () => {
  it("leaves an item that already fits exactly where it is", () => {
    const placement = placed(150, 100);

    expect(clampPlacementToRoom(sofa, placement, room)).toEqual(placement);
  });

  it("snaps a fractional centre to the nearest centimetre", () => {
    expect(clampPlacementToRoom(sofa, placed(100.4, 99.6), room)).toEqual(
      placed(100, 100),
    );
  });

  it("keeps the footprint flush with the left and top walls", () => {
    expect(clampPlacementToRoom(sofa, placed(10, 10), room)).toEqual(
      placed(50, 25),
    );
  });

  it("keeps the footprint flush with the right and bottom walls", () => {
    expect(clampPlacementToRoom(sofa, placed(290, 190), room)).toEqual(
      placed(250, 175),
    );
  });

  it("uses the rotated bounds, swapping width and depth at 90 degrees", () => {
    // Turned 90°, the 100×50 sofa occupies 50 cm along x and 100 cm along y.
    expect(clampPlacementToRoom(sofa, placed(1, 1, 90), room)).toEqual(
      placed(25, 50, 90),
    );
    expect(clampPlacementToRoom(sofa, placed(299, 199, 90), room)).toEqual(
      placed(275, 150, 90),
    );
  });

  it("keeps a rotated exact fit on whole centimetres", () => {
    const square: RoomSize = { widthCm: 100, lengthCm: 100 };

    expect(clampPlacementToRoom(sofa, placed(50, 50, 90), square)).toEqual(
      placed(50, 50, 90),
    );
  });

  it("clamps an arbitrary rotation using its bounding box", () => {
    const turned = clampPlacementToRoom(sofa, placed(0, 0, 45), room);

    expect(isInsideRoom(sofa, turned, room)).toBe(true);
    expect(turned.xCm).toBeGreaterThan(0);
    expect(turned.yCm).toBeGreaterThan(0);
  });

  it("centres an item larger than the room instead of inverting the bounds", () => {
    const huge: Size = { widthCm: 400, depthCm: 100 };

    // Too wide for the room, but still short enough to sit against the top wall.
    expect(clampPlacementToRoom(huge, placed(10, 10), room)).toEqual(
      placed(150, 50),
    );
  });

  it("does not mutate the placement it is given", () => {
    const placement = placed(10, 10);

    const clamped = clampPlacementToRoom(sofa, placement, room);

    expect(placement).toEqual(placed(10, 10));
    expect(clamped).not.toBe(placement);
  });
});

describe("dragPlacement", () => {
  it("keeps the grabbed point under the pointer", () => {
    // The centre is 10 cm right and 5 cm below the pointer when the drag starts.
    const grabOffset: Point = { x: 10, y: 5 };

    expect(
      dragPlacement(
        sofa,
        placed(150, 100),
        { x: 140, y: 95 },
        grabOffset,
        room,
      ),
    ).toEqual(placed(150, 100));
    expect(
      dragPlacement(
        sofa,
        placed(150, 100),
        { x: 200, y: 120 },
        grabOffset,
        room,
      ),
    ).toEqual(placed(210, 125));
  });

  it("keeps the item’s rotation while dragging", () => {
    expect(
      dragPlacement(
        sofa,
        placed(150, 100, 90),
        { x: 150, y: 100 },
        { x: 0, y: 0 },
        room,
      ),
    ).toEqual(placed(150, 100, 90));
  });

  it("snaps the pointer position to whole centimetres", () => {
    expect(
      dragPlacement(
        sofa,
        placed(150, 100),
        { x: 100.4, y: 99.6 },
        { x: 0, y: 0 },
        room,
      ),
    ).toEqual(placed(100, 100));
  });

  it("clamps the dragged footprint against the walls", () => {
    expect(
      dragPlacement(
        sofa,
        placed(150, 100),
        { x: -50, y: -20 },
        { x: 10, y: 5 },
        room,
      ),
    ).toEqual(placed(50, 25));
  });

  it("uses the rotated bounds while dragging", () => {
    // Turned 90°, the footprint needs 25 cm of clearance along x and 50 cm along y.
    expect(
      dragPlacement(
        sofa,
        placed(150, 100, 90),
        { x: 1, y: 1 },
        { x: 0, y: 0 },
        room,
      ),
    ).toEqual(placed(25, 50, 90));
  });

  it("does not mutate the placement or the grab offset", () => {
    const placement = placed(150, 100);
    const grabOffset: Point = { x: 10, y: 5 };

    dragPlacement(sofa, placement, { x: 200, y: 120 }, grabOffset, room);

    expect(placement).toEqual(placed(150, 100));
    expect(grabOffset).toEqual({ x: 10, y: 5 });
  });
});

describe("rotatePlacement", () => {
  it("turns the footprint a quarter turn clockwise around its centre", () => {
    expect(rotatePlacement(sofa, placed(150, 100), room)).toEqual(
      placed(150, 100, 90),
    );
  });

  it("returns to the original orientation after four turns", () => {
    const start = placed(150, 100);
    let turned = start;

    for (let turn = 0; turn < 4; turn += 1) {
      turned = rotatePlacement(sofa, turned, room);
    }

    expect(turned).toEqual(start);
  });

  it("normalises a negative rotation", () => {
    expect(rotatePlacement(sofa, placed(150, 100, -90), room)).toEqual(
      placed(150, 100, 0),
    );
  });

  it("wraps 270 degrees back to zero", () => {
    expect(rotatePlacement(sofa, placed(150, 100, 270), room)).toEqual(
      placed(150, 100, 0),
    );
  });

  it("accepts a custom rotation step", () => {
    expect(rotatePlacement(sofa, placed(150, 100), room, 45)).toEqual(
      placed(150, 100, 45),
    );
  });

  it("nudges the centre only when the rotated footprint leaves the room", () => {
    // Turned flat against the top wall, the sofa needs 50 cm of clearance in y.
    expect(rotatePlacement(sofa, placed(150, 10), room)).toEqual(
      placed(150, 50, 90),
    );
  });

  it("keeps an exact rotated fit on whole centimetres", () => {
    const square: RoomSize = { widthCm: 100, lengthCm: 100 };

    expect(rotatePlacement(sofa, placed(50, 50), square)).toEqual(
      placed(50, 50, 90),
    );
  });

  it("does not mutate the placement it is given", () => {
    const placement = placed(150, 100);

    const turned = rotatePlacement(sofa, placement, room);

    expect(placement).toEqual(placed(150, 100));
    expect(turned).not.toBe(placement);
  });
});
