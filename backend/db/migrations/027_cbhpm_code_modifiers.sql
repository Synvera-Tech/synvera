-- Migration 027: Normative modifier table (data-driven billing rules).
--
-- Context (see ADR-005-normative-modifier-table.md and docs/architecture/
-- normative-engine-roadmap.md, stage N1):
-- Per-code billing rules (quantity multiplication, laterality, access-route) are today
-- expressed as flat columns on cbhpm_codes plus hardcoded Go logic, with NO provenance,
-- confidence, or parameterization. This table is the normative layer: one row per
-- (cbhpm_code, specialty), carrying the rule, its parameters, and the verbatim manual
-- source that justifies it.
--
-- Staging contract (ADR-005): this table is introduced empty in N1. Its seed (write
-- path, N2), repository read path (N3) and engine consumption (N5) follow in later
-- stages, each test-covered. Creating it here changes NO calculation result.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS. Reversible: DROP TABLE on rollback, with no
-- loss of calculation/composition data (no FK references point into this table).

CREATE TABLE IF NOT EXISTS cbhpm_code_modifiers (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cbhpm_code          VARCHAR(20) NOT NULL,
    specialty           VARCHAR(20) NOT NULL
        CHECK (specialty IN ('NEUROSURGERY', 'SPINE')),
    billing_mode        VARCHAR(30) NOT NULL
        CHECK (billing_mode IN ('PER_PROCEDURE', 'PER_SEGMENT', 'PER_VERTEBRA',
                                'PER_STRUCTURE', 'PER_STRUCTURE_DECREMENT')),
    laterality_rule     VARCHAR(20) NOT NULL DEFAULT 'NONE'
        CHECK (laterality_rule IN ('NONE', 'NO_DUPLICATE', 'BILATERAL_DOUBLE', 'CBHPM_4_3')),
    via_rule            VARCHAR(20) NOT NULL DEFAULT 'CBHPM_DEFAULT'
        CHECK (via_rule IN ('CBHPM_DEFAULT', 'SPINE_50')),
    decrement_pct       NUMERIC(5, 2),                       -- for PER_STRUCTURE_DECREMENT (e.g. 30.00)
    max_quantity        INT,                                 -- UI cap; NULL = unbounded
    supported_modifiers JSONB       NOT NULL DEFAULT '[]'::jsonb,

    -- provenance / replay (ADR-005 §replay)
    source_document     TEXT        NOT NULL,
    source_version      VARCHAR(40) NOT NULL,
    source_page         INT,
    source_excerpt      TEXT,
    confidence          VARCHAR(20) NOT NULL
        CHECK (confidence IN ('CONFIRMED', 'INFERRED', 'WEAK')),
    implemented_at      TIMESTAMPTZ,
    verified_by         TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (cbhpm_code, specialty)
);

CREATE INDEX IF NOT EXISTS idx_cbhpm_code_modifiers_code
    ON cbhpm_code_modifiers (cbhpm_code);
CREATE INDEX IF NOT EXISTS idx_cbhpm_code_modifiers_specialty
    ON cbhpm_code_modifiers (specialty);
