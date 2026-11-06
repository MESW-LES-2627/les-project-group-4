-- US-15: the database enforces the same location rules as the API (roomLocationSchema),
-- so no other writer can store half a pair of coordinates, or a city and coordinates together.
-- Prisma does not model CHECK constraints, so this lives only in the migration.
ALTER TABLE "room" ADD CONSTRAINT "room_location_check" CHECK (
  ("latitude" IS NULL) = ("longitude" IS NULL)
  AND ("city_id" IS NULL OR "latitude" IS NULL)
  AND ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90)
  AND ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180)
);
