-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "room" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "width_cm" INTEGER NOT NULL,
    "length_cm" INTEGER NOT NULL,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100),
    "width_cm" INTEGER,
    "depth_cm" INTEGER,
    "price_eur" DECIMAL(10,2),

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

