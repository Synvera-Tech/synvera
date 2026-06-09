-- ---------------------------------------------------------------------------
-- Migration 005: add num_auxiliaries to cbhpm_codes
-- Stores the CBHPM-specified maximum number of auxiliary surgeons per code.
-- Defaults to 0 (no auxiliaries) for codes where the value is unknown.
-- ---------------------------------------------------------------------------

ALTER TABLE cbhpm_codes
    ADD COLUMN IF NOT EXISTS num_auxiliaries SMALLINT NOT NULL DEFAULT 0;
