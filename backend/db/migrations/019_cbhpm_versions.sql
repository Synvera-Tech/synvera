-- Migration 019: Create cbhpm_versions table.
--
-- Tracks editions of the CBHPM porte table used for billing.
-- Exactly one version may be active at a time (enforced by partial unique index).
-- The active version is used for all new calculations.

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
