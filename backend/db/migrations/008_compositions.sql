-- Migration 008: Compositions — reusable surgical procedure templates.
-- A composition captures the physician's procedural setup without financial values.
-- Values are always recalculated fresh when the composition is executed.
-- Designed to accept a future user_id / physician_id foreign key without schema changes.

CREATE TABLE IF NOT EXISTS compositions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id           UUID        UNIQUE NOT NULL,
    name                TEXT        NOT NULL,
    sbn_procedure_id    TEXT,
    sbn_procedure_name  TEXT        NOT NULL,
    selected_codes      JSONB       NOT NULL DEFAULT '[]'::jsonb,
    access_route_type   TEXT        NOT NULL CHECK (access_route_type IN ('same', 'different')),
    auxiliaries_count   INT         NOT NULL DEFAULT 0 CHECK (auxiliaries_count BETWEEN 0 AND 4),
    requires_anesthesia BOOLEAN     NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compositions_created_at ON compositions (created_at DESC);
