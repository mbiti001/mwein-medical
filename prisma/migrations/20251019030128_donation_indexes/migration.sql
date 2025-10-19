-- CreateIndex
CREATE INDEX "DonationSupporter_publicAcknowledgement_lastContributionAt_donationCount_idx" ON "DonationSupporter"("publicAcknowledgement", "lastContributionAt", "donationCount");

-- CreateIndex
CREATE INDEX "DonationSupporter_lastContributionAt_idx" ON "DonationSupporter"("lastContributionAt");

-- CreateIndex
CREATE INDEX "DonationTransaction_createdAt_idx" ON "DonationTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "DonationTransaction_supporterId_createdAt_idx" ON "DonationTransaction"("supporterId", "createdAt");
