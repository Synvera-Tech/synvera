-- Migration 013: Add spine surgery billing variables support
-- Adds billing mode, specialty classification, and laterality support
-- to enable deterministic calculation for spine-specific procedures.

-- ─────────────────────────────────────────────────────────────────────────────
-- Billing Mode Enum (not using SQL ENUM for flexibility)
-- Values:
--   PER_PROCEDURE (default) — base value with no quantity multiplier
--   PER_SEGMENT — base value × number of segments treated
--   PER_VERTEBRA — base value × number of vertebrae treated
--   PER_STRUCTURE — base value × number of structures treated
-- ─────────────────────────────────────────────────────────────────────────────

-- Add columns to sbn_procedures table
ALTER TABLE IF EXISTS sbn_procedures
    ADD COLUMN billing_mode VARCHAR(20) NOT NULL DEFAULT 'PER_PROCEDURE'
        CHECK (billing_mode IN ('PER_PROCEDURE', 'PER_SEGMENT', 'PER_VERTEBRA', 'PER_STRUCTURE')),
    ADD COLUMN specialty VARCHAR(20) NOT NULL DEFAULT 'NEUROSURGERY'
        CHECK (specialty IN ('NEUROSURGERY', 'SPINE')),
    ADD COLUMN laterality_support BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_sbn_procedures_specialty
    ON sbn_procedures (specialty);

CREATE INDEX IF NOT EXISTS idx_sbn_procedures_billing_mode
    ON sbn_procedures (billing_mode);

-- ─────────────────────────────────────────────────────────────────────────────
-- spine_procedure_metadata — optional metadata fields for spine procedures
-- These fields are stored but do NOT affect billing calculations.
-- They are preserved for audit trails and future use.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS spine_procedure_metadata (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sbn_procedure_id        UUID        NOT NULL UNIQUE REFERENCES sbn_procedures(id) ON DELETE CASCADE,

    -- Anatomical region (informational only)
    vertebral_region        VARCHAR(20),  -- cervical, thoracic, lumbar, lumbosacral, sacral

    -- Surgical technique (informational only)
    surgical_approach       VARCHAR(50),  -- anterior, posterior, posterolateral, lateral, minimally_invasive
    fusion_status          VARCHAR(30),  -- decompression_only, fusion, hybrid

    -- Materials/implants (informational only)
    implant_category       VARCHAR(30),  -- graft, hardware, arthroplasty, neural_device

    -- Patient factors (informational only)
    osteoporosis_aware     BOOLEAN,      -- whether osteoporosis should be noted

    -- Clinical context (informational only)
    clinical_context       VARCHAR(50),  -- traumatic, degenerative, neoplastic, infectious, deformity, revision

    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spine_metadata_sbn_procedure
    ON spine_procedure_metadata (sbn_procedure_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- calculation_modifiers — persist selected modifiers for each calculation
-- Allows tracking of quantity and laterality choices for audit and composition reuse.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS calculation_modifiers (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id          UUID        NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,

    -- Quantity modifier (applied to billing_mode)
    quantity_selected       INTEGER     DEFAULT 1,   -- number of segments, vertebrae, or structures

    -- Laterality modifier
    laterality              VARCHAR(20),  -- UNILATERAL, BILATERAL

    -- Metadata fields (not affecting calculations)
    vertebral_region        VARCHAR(20),
    surgical_approach       VARCHAR(50),
    fusion_status          VARCHAR(30),
    implant_category       VARCHAR(30),
    osteoporosis_aware     BOOLEAN,
    clinical_context       VARCHAR(50),

    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calculation_modifiers_calculation
    ON calculation_modifiers (calculation_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- composition_modifiers — persist modifiers in saved compositions
-- Allows compositions to restore full state including quantity and laterality selections.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS composition_modifiers (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    composition_id          UUID        NOT NULL UNIQUE REFERENCES compositions(id) ON DELETE CASCADE,

    -- Quantity modifier (applied to billing_mode)
    quantity_selected       INTEGER     DEFAULT 1,

    -- Laterality modifier
    laterality              VARCHAR(20),

    -- Metadata fields
    vertebral_region        VARCHAR(20),
    surgical_approach       VARCHAR(50),
    fusion_status          VARCHAR(30),
    implant_category       VARCHAR(30),
    osteoporosis_aware     BOOLEAN,
    clinical_context       VARCHAR(50),

    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_composition_modifiers_composition
    ON composition_modifiers (composition_id);
