-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "receipt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "txnDate" DATETIME,
    "userId" TEXT,
    "donationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "DonationTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_phone_idx" ON "Payment"("phone");

-- CreateIndex
CREATE INDEX "AntifraudReport_suspectPhone_idx" ON "AntifraudReport"("suspectPhone");

-- CreateIndex
CREATE INDEX "AntifraudReport_reporterContact_idx" ON "AntifraudReport"("reporterContact");

-- CreateIndex
CREATE INDEX "AppointmentRequest_phone_idx" ON "AppointmentRequest"("phone");

-- CreateIndex
CREATE INDEX "AppointmentRequest_email_idx" ON "AppointmentRequest"("email");

-- CreateIndex
CREATE INDEX "AppointmentRequest_name_idx" ON "AppointmentRequest"("name");

-- CreateIndex
CREATE INDEX "ShopOrder_phone_idx" ON "ShopOrder"("phone");

-- CreateIndex
CREATE INDEX "ShopOrder_customerName_idx" ON "ShopOrder"("customerName");
