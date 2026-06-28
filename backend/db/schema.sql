-- Synvera Database Schema — canonical post-migration state.
--
-- This file represents the full schema AFTER all migrations (001–024) have been applied.
-- It is the source of truth for sqlc code generation (sqlc.yaml references this file).
--
-- When a new migration is added, update this file to match the final state and run:
--   cd backend && sqlc generate
--
-- Migration history summary:
--   001 — initial schema (sbn_procedures, cbhpm_codes, sbn_cbhpm_mappings, portes)
--   002 — seed portes
--   003 — seed procedures
--   004 — schema extensions (trigram indexes, unaccent)
--   005 — add num_auxiliaries to cbhpm_codes
--   006 — calculations table (public_id, selected_cbhpm_codes, calculation_breakdown)
--   007 — populate num_auxiliaries
--   008 — compositions table (selected_codes, access_route_type)
--   009 — physician_accounts table
--   010 — physician_id FK on compositions (nullable for legacy rows)
--   011 — urgency_emergency column on compositions (superseded by 012)
--   012 — replace urgency_emergency with adjustments JSONB on compositions
--   013 — spine billing variables (billing_mode, laterality_support on procedures/codes)
--           also created calculation_modifiers + composition_modifiers (DROPPED in 016)
--   014 — seed spine billing modes
--   015 — add billing_mode/laterality_support to cbhpm_codes
--   016 — DROP calculation_modifiers + composition_modifiers (dead tables, never used)
--   017 — add adjustments JSONB + physician_id to calculations
--   018 — add modifiers JSONB to compositions
--   019 — cbhpm_versions table (tracks CBHPM edition used for billing)
--   020 — porte_values table (porte→value_brl scoped to a CBHPM version)
--   021 — backfill: insert 2025-2026 version, seed porte_values, add cbhpm_version_id to calculations
--   022 — add plan_type + subscription_status to physician_accounts (DEFAULT 'free'/'inactive')
--   023 — reconcile production schema (clerk_user_id, updated_at, adjustments, modifiers, spine cols)
--   024 — document search tables: documents + document_chunks with FTS (RAG v0)
--   025 — restore 3 SBN→CBHPM mappings dropped at parse time (malformed source codes)
--   026 — spine manual structured import: source_document/source_version on sbn_procedures

CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------------------
-- portes: CBHPM porte values in BRL
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portes (
    code      VARCHAR(5)     PRIMARY KEY,
    value_brl NUMERIC(10, 2) NOT NULL CHECK (value_brl > 0)
);

-- ---------------------------------------------------------------------------
-- sbn_procedures: surgical/clinical packages from the SBN manual
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sbn_procedures (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code               VARCHAR(20) UNIQUE NOT NULL,
    name               TEXT        NOT NULL,
    description        TEXT,
    billing_mode       VARCHAR(20) NOT NULL DEFAULT 'PER_PROCEDURE'
        CHECK (billing_mode IN ('PER_PROCEDURE', 'PER_SEGMENT', 'PER_VERTEBRA', 'PER_STRUCTURE')),
    specialty          VARCHAR(20) NOT NULL DEFAULT 'NEUROSURGERY'
        CHECK (specialty IN ('NEUROSURGERY', 'SPINE')),
    laterality_support BOOLEAN     NOT NULL DEFAULT FALSE,
    -- Provenance of the procedure ficha (migration 026). NEUROSURGERY procedures
    -- originate from the SBN manual; SPINE procedures from the spine coding manual.
    source_document    TEXT,
    source_version     VARCHAR(40),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sbn_procedures_name
    ON sbn_procedures USING gin (to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_sbn_procedures_specialty
    ON sbn_procedures (specialty);
CREATE INDEX IF NOT EXISTS idx_sbn_procedures_billing_mode
    ON sbn_procedures (billing_mode);

-- ---------------------------------------------------------------------------
-- cbhpm_codes: individual billable codes from the CBHPM catalog
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
-- sbn_cbhpm_mappings: junction table (SBN 1→N CBHPM)
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
-- cbhpm_versions: tracks editions of the CBHPM porte table used for billing
--
-- Exactly one version may be active at a time, enforced by a partial unique index.
-- The active version is used for all new calculations; historical calculations
-- reference whichever version was active at creation time.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cbhpm_versions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code       VARCHAR(20) UNIQUE NOT NULL,
    label      TEXT        NOT NULL,
    is_active  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique index: at most one active version at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uix_cbhpm_versions_active
    ON cbhpm_versions (is_active)
    WHERE is_active = TRUE;

-- ---------------------------------------------------------------------------
-- porte_values: porte→value_brl pairs scoped to a CBHPM version
--
-- Enables historical calculations to replay with the porte table that was
-- active at creation time, even after future tariff revisions.
-- The legacy `portes` table is retained for backward compatibility.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS porte_values (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    cbhpm_version_id UUID           NOT NULL REFERENCES cbhpm_versions(id) ON DELETE CASCADE,
    porte            VARCHAR(5)     NOT NULL,
    value_brl        NUMERIC(10, 2) NOT NULL CHECK (value_brl > 0),
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),

    UNIQUE (cbhpm_version_id, porte)
);

CREATE INDEX IF NOT EXISTS idx_porte_values_version_id
    ON porte_values (cbhpm_version_id);

-- ---------------------------------------------------------------------------
-- physician_accounts: maps Clerk identities to Synvera physician records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS physician_accounts (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id       TEXT        UNIQUE NOT NULL,
    email               TEXT,
    name                TEXT,
    plan_type           TEXT        NOT NULL DEFAULT 'free',
    subscription_status TEXT        NOT NULL DEFAULT 'inactive',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_physician_accounts_clerk_user_id
    ON physician_accounts (clerk_user_id);

-- ---------------------------------------------------------------------------
-- calculations: persisted calculation snapshots (inputs + outputs)
--
-- selected_cbhpm_codes  — full SelectedCode array; the calculation is replayable
--                         by feeding these codes + adjustments + access_route back
--                         into the valuation engine.
-- adjustments           — CBHPM adjustment codes active at calculation time
--                         (e.g. ["emergency_special_hours"]). Added in migration 017.
-- physician_id          — nullable; NULL for anonymous (pre-login) calculations.
--                         Added in migration 017.
-- cbhpm_version_id      — nullable FK to cbhpm_versions; records which porte table
--                         edition was active when this calculation was saved. NULL for
--                         pre-021 rows. Added in migration 021.
-- calculation_breakdown — full CalculateResponse JSON for audit and display.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calculations (
    id                      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id               UUID           UNIQUE NOT NULL,
    physician_id            UUID           REFERENCES physician_accounts(id) ON DELETE SET NULL,
    cbhpm_version_id        UUID           REFERENCES cbhpm_versions(id) ON DELETE SET NULL,
    procedure_name          TEXT           NOT NULL,
    procedure_sbn_code      TEXT,
    selected_cbhpm_codes    JSONB          NOT NULL,
    adjustments             JSONB          NOT NULL DEFAULT '[]'::jsonb,
    access_route            TEXT           NOT NULL CHECK (access_route IN ('same', 'different')),
    auxiliaries_count       INT            NOT NULL DEFAULT 0 CHECK (auxiliaries_count BETWEEN 0 AND 4),
    requires_anesthesia     BOOLEAN        NOT NULL DEFAULT FALSE,
    surgeon_value           NUMERIC(12, 2) NOT NULL,
    auxiliaries_total_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    anesthesiologist_value  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    team_total_value        NUMERIC(12, 2) NOT NULL,
    calculation_breakdown   JSONB          NOT NULL,
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calculations_public_id
    ON calculations (public_id);
CREATE INDEX IF NOT EXISTS idx_calculations_created_at
    ON calculations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculations_physician_id
    ON calculations (physician_id);

-- ---------------------------------------------------------------------------
-- compositions: reusable surgical procedure templates (no financial values)
--
-- selected_codes — full SelectedCode array per code (includes per-code
--                  quantity_selected and laterality for spine procedures).
-- adjustments    — CBHPM adjustment codes (e.g. ["emergency_special_hours"]).
-- modifiers      — global spine billing variable selections for this composition
--                  (e.g. {"quantity_selected":3,"laterality":"BILATERAL"}).
--                  Stored as JSONB, added in migration 018.
--                  Pre-018 rows have '{}' (empty object); application falls back
--                  to selected_codes[0].quantity_selected/laterality for those rows.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compositions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id           UUID        UNIQUE NOT NULL,
    physician_id        UUID        REFERENCES physician_accounts(id) ON DELETE CASCADE,
    name                TEXT        NOT NULL,
    sbn_procedure_id    TEXT,
    sbn_procedure_name  TEXT        NOT NULL,
    selected_codes      JSONB       NOT NULL DEFAULT '[]'::jsonb,
    access_route_type   TEXT        NOT NULL CHECK (access_route_type IN ('same', 'different')),
    auxiliaries_count   INT         NOT NULL DEFAULT 0 CHECK (auxiliaries_count BETWEEN 0 AND 4),
    requires_anesthesia BOOLEAN     NOT NULL DEFAULT FALSE,
    adjustments         JSONB       NOT NULL DEFAULT '[]'::jsonb,
    modifiers           JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compositions_physician_id
    ON compositions (physician_id);
CREATE INDEX IF NOT EXISTS idx_compositions_created_at
    ON compositions (created_at DESC);

-- ---------------------------------------------------------------------------
-- spine_procedure_metadata: optional informational metadata for spine procedures
-- These fields do NOT affect billing calculations.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS spine_procedure_metadata (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sbn_procedure_id   UUID        NOT NULL UNIQUE REFERENCES sbn_procedures(id) ON DELETE CASCADE,
    vertebral_region   VARCHAR(20),
    surgical_approach  VARCHAR(50),
    fusion_status      VARCHAR(30),
    implant_category   VARCHAR(30),
    osteoporosis_aware BOOLEAN,
    clinical_context   VARCHAR(50),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spine_metadata_sbn_procedure
    ON spine_procedure_metadata (sbn_procedure_id);

-- ---------------------------------------------------------------------------
-- documents: registry of indexed source documents (RAG v0)
--
-- Each row represents a document whose text has been chunked and indexed for
-- Full Text Search. document_type constrains to known CBHPM/SBN sources.
-- The document layer is read-only and NEVER influences fee calculations.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    version_label TEXT        NOT NULL,
    document_type TEXT        NOT NULL
        CHECK (document_type IN ('cbhpm', 'sbn_manual', 'spine_manual')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- document_chunks: indexed text segments with FTS vector (RAG v0)
--
-- search_vector is a GENERATED ALWAYS AS STORED tsvector over
-- (section_title || chunk_text) using the 'portuguese' dictionary.
-- GIN index enables fast full-text queries via plainto_tsquery / to_tsquery.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_chunks (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id   UUID    NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number   INT     NOT NULL,
    section_title TEXT,
    chunk_text    TEXT    NOT NULL,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector(
            'portuguese',
            coalesce(section_title, '') || ' ' || chunk_text
        )
    ) STORED,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_search
    ON document_chunks USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
    ON document_chunks (document_id);

-- ---------------------------------------------------------------------------
-- cbhpm_code_modifiers: normative, data-driven billing rules per CBHPM code
--
-- One row per (cbhpm_code, specialty). Carries the billing rule, its parameters,
-- and the verbatim manual source that justifies it (provenance/replay fields).
-- Opt-in: absence of a row ⇒ PER_PROCEDURE default with CBHPM via/laterality rules.
-- See ADR-005-normative-modifier-table.md. Introduced empty in migration 027;
-- seed/read/engine consumption follow in roadmap stages N2/N3/N5 (no calc change yet).
-- ---------------------------------------------------------------------------
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
    decrement_pct       NUMERIC(5, 2),
    max_quantity        INT,
    supported_modifiers JSONB       NOT NULL DEFAULT '[]'::jsonb,

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
