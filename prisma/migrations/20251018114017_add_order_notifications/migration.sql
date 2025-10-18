-- CreateTable
CREATE TABLE "OrderNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "recipient" TEXT,
    "summary" TEXT NOT NULL,
    "metadataJson" TEXT,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderNotification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShopOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OrderNotification_orderId_createdAt_idx" ON "OrderNotification"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderNotification_channel_createdAt_idx" ON "OrderNotification"("channel", "createdAt");
