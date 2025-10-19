-- Migration: Add performance indexes
-- This should be converted to a proper Prisma migration

-- Add indexes for frequently queried fields that might be missing

-- Phone number lookups (for duplicate checking, M-Pesa, etc.)
CREATE INDEX IF NOT EXISTS "AppointmentRequest_phone_idx" ON "AppointmentRequest"("phone");
CREATE INDEX IF NOT EXISTS "DonationTransaction_phone_idx" ON "DonationTransaction"("phone");  
CREATE INDEX IF NOT EXISTS "ShopOrder_phone_idx" ON "ShopOrder"("phone");

-- Email lookups
CREATE INDEX IF NOT EXISTS "AppointmentRequest_email_idx" ON "AppointmentRequest"("email") WHERE "email" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "AdminUser_email_idx" ON "AdminUser"("email"); -- Should already exist via @unique

-- Status and date combinations for dashboard queries
CREATE INDEX IF NOT EXISTS "AppointmentRequest_status_date_idx" ON "AppointmentRequest"("status", "consultationDate") WHERE "consultationDate" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "ShopOrder_status_created_idx" ON "ShopOrder"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "DonationTransaction_status_created_idx" ON "DonationTransaction"("status", "createdAt");

-- Admin audit queries
CREATE INDEX IF NOT EXISTS "AuditLog_admin_action_created_idx" ON "AuditLog"("adminId", "action", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_ip_created_idx" ON "AuditLog"("ip", "createdAt") WHERE "ip" IS NOT NULL;

-- Fraud report investigations
CREATE INDEX IF NOT EXISTS "AntifraudReport_suspect_phone_idx" ON "AntifraudReport"("suspectPhone") WHERE "suspectPhone" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "AntifraudReport_reporter_contact_idx" ON "AntifraudReport"("reporterContact") WHERE "reporterContact" IS NOT NULL;

-- Order notifications for recent activity
CREATE INDEX IF NOT EXISTS "OrderNotification_status_created_idx" ON "OrderNotification"("status", "createdAt");

-- Supporter analytics
CREATE INDEX IF NOT EXISTS "DonationSupporter_amount_count_idx" ON "DonationSupporter"("totalAmount", "donationCount");

-- Text search preparation (for future full-text search)
-- CREATE INDEX IF NOT EXISTS "AppointmentRequest_name_gin_idx" ON "AppointmentRequest" USING gin(to_tsvector('english', "name"));
-- CREATE INDEX IF NOT EXISTS "AppointmentRequest_reason_gin_idx" ON "AppointmentRequest" USING gin(to_tsvector('english', "reason"));

-- Partial indexes for active/pending records (most common queries)
CREATE INDEX IF NOT EXISTS "AppointmentRequest_active_created_idx" ON "AppointmentRequest"("createdAt") WHERE "status" IN ('NEW', 'CONFIRMED', 'IN_PROGRESS');
CREATE INDEX IF NOT EXISTS "ShopOrder_pending_created_idx" ON "ShopOrder"("createdAt") WHERE "status" IN ('PENDING', 'CONFIRMED', 'PROCESSING');
CREATE INDEX IF NOT EXISTS "DonationTransaction_pending_created_idx" ON "DonationTransaction"("createdAt") WHERE "status" IN ('PENDING', 'PROCESSING');