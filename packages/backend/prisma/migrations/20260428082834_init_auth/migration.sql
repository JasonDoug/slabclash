-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('uploaded', 'processing', 'awaiting_user_confirm', 'verified', 'flagged');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "inAppCurrencyBalance" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardIngestionJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageFrontKey" TEXT,
    "imageBackKey" TEXT,
    "status" "IngestionStatus" NOT NULL DEFAULT 'uploaded',
    "ocrText" TEXT,
    "phash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardIngestionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "CardIngestionJob" ADD CONSTRAINT "CardIngestionJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
