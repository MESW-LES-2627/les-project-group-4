import { describe, expect, it } from "vitest";

import { isInsideRoom } from "@/features/plan/model/geometry";
import type { Placement, RoomSize, Size } from "@/features/plan/model/geometry";

import { clampPlacementToRoom } from "./manipulation";

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
