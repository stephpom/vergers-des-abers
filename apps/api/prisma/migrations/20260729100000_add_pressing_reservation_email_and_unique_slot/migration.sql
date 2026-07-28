-- Preserve existing reservations while introducing the now-required email field.
-- Existing rows receive an empty email instead of being deleted.
ALTER TABLE "PressingReservation"
ADD COLUMN "email" TEXT NOT NULL DEFAULT '';

ALTER TABLE "PressingReservation"
ALTER COLUMN "email" DROP DEFAULT;

-- A slot can only have one reservation. If historical duplicates exist, this
-- statement fails safely without deleting or merging any reservation.
DROP INDEX "PressingReservation_slotId_idx";
CREATE UNIQUE INDEX "PressingReservation_slotId_key"
ON "PressingReservation"("slotId");
