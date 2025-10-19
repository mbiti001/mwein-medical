-- CreateTable
CREATE TABLE "DonationTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "accountReference" TEXT NOT NULL,
    "checkoutRequestId" TEXT,
    "merchantRequestId" TEXT,
    "mpesaReceiptNumber" TEXT,
    "resultCode" TEXT,
    "resultDescription" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "callbackMetadata" TEXT,
    "supporterId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DonationTransaction_supporterId_fkey" FOREIGN KEY ("supporterId") REFERENCES "DonationSupporter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AntifraudReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterAlias" TEXT,
    "reporterContact" TEXT,
    "suspectName" TEXT,
    "suspectPhone" TEXT,
    "transactionAmount" INTEGER,
    "transactionReason" TEXT NOT NULL,
    "transactionDate" DATETIME,
    "evidenceSummary" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "identifier" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminPasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminPasswordReset_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DonationTransaction_normalizedPhone_createdAt_idx" ON "DonationTransaction"("normalizedPhone", "createdAt");

-- CreateIndex
CREATE INDEX "DonationTransaction_status_createdAt_idx" ON "DonationTransaction"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DonationTransaction_checkoutRequestId_key" ON "DonationTransaction"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "AntifraudReport_status_createdAt_idx" ON "AntifraudReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AntifraudReport_identifier_idx" ON "AntifraudReport"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPasswordReset_tokenHash_key" ON "AdminPasswordReset"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminPasswordReset_expiresAt_idx" ON "AdminPasswordReset"("expiresAt");
