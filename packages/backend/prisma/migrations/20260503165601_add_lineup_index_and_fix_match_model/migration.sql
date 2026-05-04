/*
  Warnings:

  - You are about to drop the column `winnerId` on the `Match` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Lineup" ADD COLUMN     "aggregateMomentum" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "winnerId",
ADD COLUMN     "winnerLineupId" TEXT;

-- CreateIndex
CREATE INDEX "Lineup_userId_idx" ON "Lineup"("userId");

-- CreateIndex
CREATE INDEX "Match_lineupAId_idx" ON "Match"("lineupAId");

-- CreateIndex
CREATE INDEX "Match_lineupBId_idx" ON "Match"("lineupBId");
