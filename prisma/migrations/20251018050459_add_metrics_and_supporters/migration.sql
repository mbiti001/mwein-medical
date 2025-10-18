-- CreateTable
CREATE TABLE "SiteMetric" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DonationSupporter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "donationCount" INTEGER NOT NULL DEFAULT 0,
    "lastChannel" TEXT,
    "lastContributionAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DonationSupporter_normalizedName_key" ON "DonationSupporter"("normalizedName");

-- CreateIndex
CREATE INDEX "DonationSupporter_donationCount_totalAmount_idx" ON "DonationSupporter"("donationCount", "totalAmount");
