-- CreateTable
CREATE TABLE "ShopOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "contactChannel" TEXT,
    "itemsJson" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "statusChangedAt" DATETIME,
    "handledBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopOrder_reference_key" ON "ShopOrder"("reference");

-- CreateIndex
CREATE INDEX "ShopOrder_status_createdAt_idx" ON "ShopOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ShopOrder_reference_idx" ON "ShopOrder"("reference");
