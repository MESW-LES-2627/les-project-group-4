/*
  Warnings:

  - You are about to drop the column `price_eur` on the `item` table. All the data in the column will be lost.
  - You are about to alter the column `category` on the `item` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(50)`.
  - A unique constraint covering the columns `[slug]` on the table `item` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `price_cents` to the `item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `item` table without a default value. This is not possible if the table is not empty.
  - Made the column `category` on table `item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `width_cm` on table `item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `depth_cm` on table `item` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "item" DROP COLUMN "price_eur",
ADD COLUMN     "height_cm" INTEGER,
ADD COLUMN     "price_cents" INTEGER NOT NULL,
ADD COLUMN     "room_type_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "slug" VARCHAR(100) NOT NULL,
ADD COLUMN     "source" VARCHAR(100) NOT NULL,
ADD COLUMN     "source_url" VARCHAR(500),
ADD COLUMN     "style_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "category" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "width_cm" SET NOT NULL,
ALTER COLUMN "depth_cm" SET NOT NULL;

-- CreateTable
CREATE TABLE "city" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "country" CHAR(2) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "city_slug_key" ON "city"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "item_slug_key" ON "item"("slug");

-- CreateIndex
CREATE INDEX "item_category_idx" ON "item"("category");
