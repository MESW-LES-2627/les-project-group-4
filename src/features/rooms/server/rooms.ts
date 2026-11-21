import 'server-only'

import { CITY_SELECT } from '@/features/locations/server/cities'
import { getDb } from '@/lib/db'

import type { CreateRoomInput } from '../schema'
import type { Room } from '../types'

// The room fields the API returns (see Room in features/rooms/types.ts).
// Shared by the rooms routes and pages so they all return the same shape.
export const ROOM_SELECT = {
  id: true,
  name: true,
  widthCm: true,
  lengthCm: true,
  // US-15: the location (a city, or the browser's coordinates).
  city: { select: CITY_SELECT },
  latitude: true,
  longitude: true,
} as const

/** US-02: every room, newest first. Used by GET /api/rooms and the /rooms page. */
export function findRooms(): Promise<Room[]> {
  return getDb().room.findMany({
    select: ROOM_SELECT,
    // id breaks ties between rooms created in the same millisecond.
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  })
}

/** US-03: one room, or null if it does not exist. Used by GET /api/rooms/[id] and the /rooms/[id] page. */
export function findRoomById(id: number): Promise<Room | null> {
  return getDb().room.findUnique({ where: { id }, select: ROOM_SELECT })
}

/** US-01: creates a room with the validated input. Used by POST /api/rooms. */
export function createRoom(input: CreateRoomInput): Promise<Room> {
  return getDb().room.create({ data: input, select: ROOM_SELECT })
}
