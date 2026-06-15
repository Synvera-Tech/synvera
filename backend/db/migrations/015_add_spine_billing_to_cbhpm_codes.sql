-- Migration 015: Add spine billing variables to cbhpm_codes
-- Adds billing_mode, specialty, and laterality_support columns to cbhpm_codes
-- to enable deterministic calculation of spine-specific procedures.

ALTER TABLE IF EXISTS cbhpm_codes
    ADD COLUMN IF NOT EXISTS billing_mode VARCHAR(20) NOT NULL DEFAULT 'PER_PROCEDURE'
        CHECK (billing_mode IN ('PER_PROCEDURE', 'PER_SEGMENT', 'PER_VERTEBRA', 'PER_STRUCTURE')),
    ADD COLUMN IF NOT EXISTS specialty VARCHAR(20) NOT NULL DEFAULT 'NEUROSURGERY'
        CHECK (specialty IN ('NEUROSURGERY', 'SPINE')),
    ADD COLUMN IF NOT EXISTS laterality_support BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_cbhpm_codes_specialty
    ON cbhpm_codes (specialty);

CREATE INDEX IF NOT EXISTS idx_cbhpm_codes_billing_mode
    ON cbhpm_codes (billing_mode);
