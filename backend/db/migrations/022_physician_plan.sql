-- Migration 022: Add plan_type and subscription_status to physician_accounts.
-- Introduces billing-tier awareness at the account level.
-- Both columns have safe defaults so existing rows are backfilled automatically:
--   plan_type            = 'free'     — all existing physicians are on the free tier
--   subscription_status  = 'inactive' — no active payment gateway is configured yet
-- No gateway integration is required for this migration.
-- Rollback: ALTER TABLE physician_accounts DROP COLUMN plan_type, DROP COLUMN subscription_status;

ALTER TABLE physician_accounts
    ADD COLUMN IF NOT EXISTS plan_type           TEXT NOT NULL DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive';
