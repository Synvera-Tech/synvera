-- Migration 023: Reconcile production schema with codebase migrations 009–018.
--
-- The production Neon database was bootstrapped from an earlier schema that predates
-- the Clerk auth integration and several feature migrations. This migration brings
-- the production schema into sync with schema.sql without touching the data on tables
-- that were already properly migrated (cbhpm_versions, porte_values, cbhpm_codes).
--
-- All tables affected are empty, so NOT NULL additions and constraint changes are safe.
--
-- What this migration covers:
--   physician_accounts — add clerk_user_id, updated_at; relax NOT NULL on email/name
--   compositions       — add adjustments (migration 012), modifiers (migration 018)
--   calculations       — add adjustments, physician_id (migration 017)
--   sbn_procedures     — add billing_mode, specialty, laterality_support (migrations 013–014)

-- ─────────────────────────────────────────────────────────────────────────────
-- physician_accounts
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE physician_accounts
    ADD COLUMN IF NOT EXISTS clerk_user_id TEXT,
    ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT now();

-- Relax NOT NULL constraints that exist in production but not in schema.sql.
ALTER TABLE physician_accounts
    ALTER COLUMN email DROP NOT NULL,
    ALTER COLUMN name  DROP NOT NULL;

-- Unique constraint on clerk_user_id (required by FindOrCreatePhysician ON CONFLICT).
-- The table is empty so there are no conflicts.
ALTER TABLE physician_accounts
    ADD CONSTRAINT physician_accounts_clerk_user_id_key UNIQUE (clerk_user_id);

-- NOT NULL is applied after the unique constraint to keep the ALTER atomic.
ALTER TABLE physician_accounts
    ALTER COLUMN clerk_user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_physician_accounts_clerk_user_id
    ON physician_accounts (clerk_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- compositions (migrations 012 + 018)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE compositions
    ADD COLUMN IF NOT EXISTS adjustments JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS modifiers   JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────────────────────
-- calculations (migration 017)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE calculations
    ADD COLUMN IF NOT EXISTS adjustments  JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS physician_id UUID  REFERENCES physician_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_calculations_physician_id
    ON calculations (physician_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- sbn_procedures (migrations 013–014)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE sbn_procedures
    ADD COLUMN IF NOT EXISTS billing_mode       VARCHAR(20) NOT NULL DEFAULT 'PER_PROCEDURE'
        CHECK (billing_mode IN ('PER_PROCEDURE', 'PER_SEGMENT', 'PER_VERTEBRA', 'PER_STRUCTURE')),
    ADD COLUMN IF NOT EXISTS specialty          VARCHAR(20) NOT NULL DEFAULT 'NEUROSURGERY'
        CHECK (specialty IN ('NEUROSURGERY', 'SPINE')),
    ADD COLUMN IF NOT EXISTS laterality_support BOOLEAN     NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_sbn_procedures_specialty
    ON sbn_procedures (specialty);

CREATE INDEX IF NOT EXISTS idx_sbn_procedures_billing_mode
    ON sbn_procedures (billing_mode);

-- Seed SPINE specialty for procedures documented in the spine manual.
UPDATE sbn_procedures
SET specialty = 'SPINE'
WHERE code IN (
  '1.01.01.01-2', '1.01.01.03-9', '1.01.02.01-9', '1.01.04.01-1', '1.01.05.07-7',
  '2.01.01.35-0', '2.01.03.14-0', '2.01.03.30-1', '2.01.04.10-3', '2.02.02.04-0',
  '3.02.15.02-1', '3.03.11.05-5', '3.06.01.02-9', '3.06.01.19-3', '3.07.09.01-6',
  '3.07.13.13-7', '3.07.13.14-5', '3.07.15.01-6', '3.07.15.02-4', '3.07.15.03-2',
  '3.07.15.05-9', '3.07.15.09-1', '3.07.15.10-5', '3.07.15.11-3', '3.07.15.12-1',
  '3.07.15.15-6', '3.07.15.16-4', '3.07.15.17-2', '3.07.15.18-0', '3.07.15.19-9',
  '3.07.15.20-2', '3.07.15.21-0', '3.07.15.22-9', '3.07.15.23-7', '3.07.15.24-5',
  '3.07.15.26-1', '3.07.15.27-0', '3.07.15.28-8', '3.07.15.29-6', '3.07.15.31-8',
  '3.07.15.32-6', '3.07.15.34-2', '3.07.15.35-0', '3.07.15.36-9', '3.07.15.38-5',
  '3.07.15.39-3', '3.07.15.59-8', '3.07.32.02-6', '3.09.10.13-7', '3.13.07.10-8',
  '3.14.01.10-4', '3.14.01.26-0', '3.14.03.02-6', '3.14.03.03-4', '3.14.03.12-3',
  '3.14.03.14-0', '3.14.03.21-2', '3.14.03.33-6', '3.14.05.01-0', '3.16.01.01-4',
  '3.16.02.05-3', '3.16.02.06-1', '3.16.02.07-0', '3.16.02.09-6', '3.16.02.10-0',
  '3.16.02.14-2', '3.16.02.15-0', '3.16.02.16-9', '3.16.02.17-7', '3.16.02.21-5',
  '3.16.02.22-3', '4.08.11.02-6', '4.08.13.36-3', '4.08.14.09-2', '4.08.14.10-6'
);

UPDATE sbn_procedures
SET billing_mode = 'PER_SEGMENT'
WHERE code IN ('4.08.13.36-3', '3.14.03.33-6', '3.07.15.59-8', '2.01.03.14-0');

UPDATE sbn_procedures
SET laterality_support = true
WHERE code IN ('4.08.13.36-3', '3.14.03.33-6', '2.01.03.14-0');
