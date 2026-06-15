-- Afere Database Schema (post-migration state)
-- This schema represents the full current structure after all migrations.
-- Used by sqlc for type-safe code generation.

CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------------------
-- portes: CBHPM porte values in BRL
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portes (
    code      VARCHAR(5)      PRIMARY KEY,
    value_brl NUMERIC(10, 2)  NOT NULL CHECK (value_brl > 0)
);

-- ---------------------------------------------------------------------------
-- sbn_procedures: surgical/clinical packages from the SBN manual
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sbn_procedures (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code             VARCHAR(20) UNIQUE NOT NULL,
    name             TEXT        NOT NULL,
    description      TEXT,
    billing_mode     VARCHAR(20) NOT NULL DEFAULT 'PER_PROCEDURE'
        CHECK (billing_mode IN ('PER_PROCEDURE', 'PER_SEGMENT', 'PER_VERTEBRA', 'PER_STRUCTURE')),
    specialty        VARCHAR(20) NOT NULL DEFAULT 'NEUROSURGERY'
        CHECK (specialty IN ('NEUROSURGERY', 'SPINE')),
    laterality_support BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sbn_procedures_name
    ON sbn_procedures USING gin (to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_sbn_procedures_specialty
    ON sbn_procedures (specialty);
CREATE INDEX IF NOT EXISTS idx_sbn_procedures_billing_mode
    ON sbn_procedures (billing_mode);

-- ---------------------------------------------------------------------------
-- cbhpm_codes: Individual billable codes from CBHPM catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cbhpm_codes (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code               VARCHAR(20) UNIQUE NOT NULL,
    description        TEXT        NOT NULL,
    num_auxiliaries    SMALLINT    NOT NULL DEFAULT 0,
    billing_mode       VARCHAR(20) NOT NULL DEFAULT 'PER_PROCEDURE'
        CHECK (billing_mode IN ('PER_PROCEDURE', 'PER_SEGMENT', 'PER_VERTEBRA', 'PER_STRUCTURE')),
    specialty          VARCHAR(20) NOT NULL DEFAULT 'NEUROSURGERY'
        CHECK (specialty IN ('NEUROSURGERY', 'SPINE')),
    laterality_support BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cbhpm_codes_code
    ON cbhpm_codes (code);
CREATE INDEX IF NOT EXISTS idx_cbhpm_codes_description
    ON cbhpm_codes USING gin (to_tsvector('portuguese', description));
CREATE INDEX IF NOT EXISTS idx_cbhpm_codes_specialty
    ON cbhpm_codes (specialty);
CREATE INDEX IF NOT EXISTS idx_cbhpm_codes_billing_mode
    ON cbhpm_codes (billing_mode);

-- ---------------------------------------------------------------------------
-- sbn_cbhpm_mappings: Junction table (SBN 1→N CBHPM relationship)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sbn_cbhpm_mappings (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sbn_procedure_id UUID        NOT NULL REFERENCES sbn_procedures(id) ON DELETE CASCADE,
    cbhpm_code_id    UUID        NOT NULL REFERENCES cbhpm_codes(id)    ON DELETE CASCADE,
    porte_code       VARCHAR(5)  NOT NULL REFERENCES portes(code),
    sort_order       INTEGER     NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (sbn_procedure_id, cbhpm_code_id)
);

CREATE INDEX IF NOT EXISTS idx_mappings_sbn_procedure
    ON sbn_cbhpm_mappings (sbn_procedure_id, sort_order);

-- ---------------------------------------------------------------------------
-- physician_accounts: Physician profile and credentials
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS physician_accounts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id   VARCHAR(255) UNIQUE NOT NULL,
    email           VARCHAR(255),
    name            VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_physician_accounts_clerk_user_id
    ON physician_accounts (clerk_user_id);

-- ---------------------------------------------------------------------------
-- compositions: Saved procedure compositions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compositions (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    physician_id         UUID        NOT NULL REFERENCES physician_accounts(id) ON DELETE CASCADE,
    sbn_procedure_id     UUID        NOT NULL REFERENCES sbn_procedures(id),
    name                 TEXT        NOT NULL,
    adjustments          JSONB       NOT NULL DEFAULT '[]',
    auxiliaries_count    SMALLINT    NOT NULL DEFAULT 0,
    requires_anesthesia  BOOLEAN     NOT NULL DEFAULT FALSE,
    access_route_type    VARCHAR(50),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compositions_physician
    ON compositions (physician_id);
CREATE INDEX IF NOT EXISTS idx_compositions_sbn_procedure
    ON compositions (sbn_procedure_id);

-- ---------------------------------------------------------------------------
-- composition_modifiers: Modifiers saved with compositions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS composition_modifiers (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    composition_id       UUID        NOT NULL UNIQUE REFERENCES compositions(id) ON DELETE CASCADE,
    quantity_selected    INTEGER     DEFAULT 1,
    laterality           VARCHAR(20),
    vertebral_region     VARCHAR(20),
    surgical_approach    VARCHAR(50),
    fusion_status        VARCHAR(30),
    implant_category     VARCHAR(30),
    osteoporosis_aware   BOOLEAN,
    clinical_context     VARCHAR(50),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_composition_modifiers_composition
    ON composition_modifiers (composition_id);

-- ---------------------------------------------------------------------------
-- calculations: Calculation snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calculations (
    id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    procedure_name            TEXT        NOT NULL,
    procedure_sbn_code        VARCHAR(20),
    surgeon_value             NUMERIC(12, 2),
    auxiliaries_total_value   NUMERIC(12, 2),
    anesthesiologist_value    NUMERIC(12, 2),
    team_total_value          NUMERIC(12, 2),
    auxiliaries_count         SMALLINT,
    requires_anesthesia       BOOLEAN,
    access_route              VARCHAR(50),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calculations_created_at
    ON calculations (created_at DESC);

-- ---------------------------------------------------------------------------
-- calculation_modifiers: Modifiers saved with calculations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calculation_modifiers (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id       UUID        NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
    quantity_selected    INTEGER     DEFAULT 1,
    laterality           VARCHAR(20),
    vertebral_region     VARCHAR(20),
    surgical_approach    VARCHAR(50),
    fusion_status        VARCHAR(30),
    implant_category     VARCHAR(30),
    osteoporosis_aware   BOOLEAN,
    clinical_context     VARCHAR(50),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calculation_modifiers_calculation
    ON calculation_modifiers (calculation_id);

-- ---------------------------------------------------------------------------
-- spine_procedure_metadata: Optional metadata for spine procedures
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS spine_procedure_metadata (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sbn_procedure_id     UUID        NOT NULL UNIQUE REFERENCES sbn_procedures(id) ON DELETE CASCADE,
    vertebral_region     VARCHAR(20),
    surgical_approach    VARCHAR(50),
    fusion_status        VARCHAR(30),
    implant_category     VARCHAR(30),
    osteoporosis_aware   BOOLEAN,
    clinical_context     VARCHAR(50),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spine_metadata_sbn_procedure
    ON spine_procedure_metadata (sbn_procedure_id);
