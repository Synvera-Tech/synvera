-- Migration 020: Create porte_values table.
--
-- Stores porte→value_brl pairs scoped to a CBHPM version.
-- Enables historical calculations to replay with the porte table that was
-- active at creation time, even after future tariff revisions.
-- The legacy `portes` table is retained for backward compatibility.

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
