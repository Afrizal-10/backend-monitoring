/*
  Warnings:

  - You are about to drop the `temperatures` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "temperatures";

-- CreateTable
CREATE TABLE "temperature_current" (
    "rack" TEXT NOT NULL,
    "packet" INTEGER NOT NULL,
    "topTemperature" DOUBLE PRECISION NOT NULL,
    "middleTemperature" DOUBLE PRECISION NOT NULL,
    "bottomTemperature" DOUBLE PRECISION NOT NULL,
    "topHumidity" DOUBLE PRECISION NOT NULL,
    "middleHumidity" DOUBLE PRECISION NOT NULL,
    "bottomHumidity" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temperature_current_pkey" PRIMARY KEY ("rack")
);

-- CreateTable
CREATE TABLE "temperature_history" (
    "id" TEXT NOT NULL,
    "rack" TEXT NOT NULL,
    "packet" INTEGER NOT NULL,
    "topTemperature" DOUBLE PRECISION NOT NULL,
    "middleTemperature" DOUBLE PRECISION NOT NULL,
    "bottomTemperature" DOUBLE PRECISION NOT NULL,
    "topHumidity" DOUBLE PRECISION NOT NULL,
    "middleHumidity" DOUBLE PRECISION NOT NULL,
    "bottomHumidity" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temperature_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "temperature_history_rack_idx" ON "temperature_history"("rack");

-- CreateIndex
CREATE INDEX "temperature_history_created_at_idx" ON "temperature_history"("created_at");
