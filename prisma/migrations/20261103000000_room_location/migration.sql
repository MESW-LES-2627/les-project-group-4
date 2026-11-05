-- US-15: a room's location is a seeded city or the browser's coordinates (both optional).
-- AlterTable
ALTER TABLE "room" ADD COLUMN     "city_id" INTEGER,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AddForeignKey
-- Deleting a city keeps its rooms; they just lose their location.
ALTER TABLE "room" ADD CONSTRAINT "room_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE SET NULL ON UPDATE CASCADE;
