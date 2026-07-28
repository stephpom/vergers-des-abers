-- CreateEnum
CREATE TYPE "PressingRate" AS ENUM ('WITH_BOTTLES', 'WITHOUT_BOTTLES');

-- CreateTable
CREATE TABLE "PressingSlot" (
    "id" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "capacityKg" INTEGER NOT NULL DEFAULT 800,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressingReservation" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "quantityKg" INTEGER NOT NULL,
    "rate" "PressingRate" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PressingReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PressingSlot_startsAt_key" ON "PressingSlot"("startsAt");

-- CreateIndex
CREATE INDEX "PressingSlot_startsAt_idx" ON "PressingSlot"("startsAt");

-- CreateIndex
CREATE INDEX "PressingReservation_slotId_idx" ON "PressingReservation"("slotId");

-- AddForeignKey
ALTER TABLE "PressingReservation" ADD CONSTRAINT "PressingReservation_slotId_fkey"
FOREIGN KEY ("slotId") REFERENCES "PressingSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PressingSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressingSettings_pkey" PRIMARY KEY ("id")
);

-- Keep the booking service disabled until it is explicitly enabled from the admin.
INSERT INTO "PressingSettings" ("id", "enabled", "updatedAt")
VALUES ('main', false, CURRENT_TIMESTAMP);
