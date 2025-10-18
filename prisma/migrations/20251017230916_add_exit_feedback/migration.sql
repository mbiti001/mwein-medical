-- CreateTable
CREATE TABLE "ExitFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outcome" TEXT NOT NULL,
    "explanation" TEXT,
    "email" TEXT,
    "pagePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ExitFeedback_createdAt_idx" ON "ExitFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "ExitFeedback_outcome_idx" ON "ExitFeedback"("outcome");
