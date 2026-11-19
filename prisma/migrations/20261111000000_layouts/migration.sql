-- US-13 / US-14: named layouts saved under a room, and the items placed in them.
-- Deleting a room deletes its layouts, and deleting a layout deletes its items.
-- An item that is used in a saved layout cannot be deleted from the catalog.
-- CreateTable
CREATE TABLE "layout" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "layout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layout_item" (
    "id" SERIAL NOT NULL,
    "layout_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "x_cm" DOUBLE PRECISION NOT NULL,
    "y_cm" DOUBLE PRECISION NOT NULL,
    "rotation_deg" DOUBLE PRECISION NOT NULL,
    "price_cents" INTEGER NOT NULL,

    CONSTRAINT "layout_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "layout_room_id_name_key" ON "layout"("room_id", "name");

-- CreateIndex
CREATE INDEX "layout_item_layout_id_idx" ON "layout_item"("layout_id");

-- AddForeignKey
ALTER TABLE "layout" ADD CONSTRAINT "layout_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layout_item" ADD CONSTRAINT "layout_item_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "layout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layout_item" ADD CONSTRAINT "layout_item_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

