-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppointmentRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "preferredDate" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "patientAge" INTEGER,
    "patientGender" TEXT,
    "consultationType" TEXT NOT NULL DEFAULT 'IN_PERSON',
    "consultationDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "identifier" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppointmentRequest" ("createdAt", "email", "id", "identifier", "name", "notes", "phone", "preferredDate", "preferredTime", "reason", "status", "updatedAt") SELECT "createdAt", "email", "id", "identifier", "name", "notes", "phone", "preferredDate", "preferredTime", "reason", "status", "updatedAt" FROM "AppointmentRequest";
DROP TABLE "AppointmentRequest";
ALTER TABLE "new_AppointmentRequest" RENAME TO "AppointmentRequest";
CREATE INDEX "AppointmentRequest_status_createdAt_idx" ON "AppointmentRequest"("status", "createdAt");
CREATE INDEX "AppointmentRequest_identifier_idx" ON "AppointmentRequest"("identifier");
CREATE INDEX "AppointmentRequest_consultationType_consultationDate_idx" ON "AppointmentRequest"("consultationType", "consultationDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
