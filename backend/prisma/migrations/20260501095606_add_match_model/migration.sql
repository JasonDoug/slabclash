-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('casual', 'ranked');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "lineupAId" TEXT NOT NULL,
    "lineupBId" TEXT NOT NULL,
    "matchType" "MatchType" NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'pending',
    "matchSeed" TEXT NOT NULL,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_lineupAId_fkey" FOREIGN KEY ("lineupAId") REFERENCES "Lineup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_lineupBId_fkey" FOREIGN KEY ("lineupBId") REFERENCES "Lineup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
