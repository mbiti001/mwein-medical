-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DonationSupporter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "donationCount" INTEGER NOT NULL DEFAULT 0,
    "lastChannel" TEXT,
    "lastContributionAt" DATETIME,
    "publicAcknowledgement" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_DonationSupporter" ("createdAt", "donationCount", "firstName", "id", "lastChannel", "lastContributionAt", "normalizedName", "totalAmount", "updatedAt") SELECT "createdAt", "donationCount", "firstName", "id", "lastChannel", "lastContributionAt", "normalizedName", "totalAmount", "updatedAt" FROM "DonationSupporter";
DROP TABLE "DonationSupporter";
ALTER TABLE "new_DonationSupporter" RENAME TO "DonationSupporter";
CREATE UNIQUE INDEX "DonationSupporter_normalizedName_key" ON "DonationSupporter"("normalizedName");
CREATE INDEX "DonationSupporter_donationCount_totalAmount_idx" ON "DonationSupporter"("donationCount", "totalAmount");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
