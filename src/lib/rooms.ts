// The room fields the API returns (see Room in src/api/types.ts).
// Shared by every rooms route so they all return the same shape.
export const ROOM_SELECT = { id: true, name: true, widthCm: true, lengthCm: true } as const
