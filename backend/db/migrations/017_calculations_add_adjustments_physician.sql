-- Migration 017: Make calculations fully auditable and replayable.
--
-- Before this migration, a saved calculation row stored output values
-- (surgeon_value, team_total_value, etc.) but not the full inputs:
--   - adjustments were not persisted (only embedded inside calculation_breakdown JSON)
--   - physician_id was not linked (calculations were always anonymous)
--
-- After this migration:
--   - adjustments holds the array of CBHPM adjustment codes that were applied
--     (e.g. ["emergency_special_hours"]). A calculation row can now be replayed
--     by feeding selected_cbhpm_codes + adjustments + access_route + auxiliaries_count
--     back into the valuation engine and verifying the output matches.
--   - physician_id links the calculation to the authenticated physician when one was
--     present at save time. Nullable: anonymous (pre-login) calculations keep NULL.

ALTER TABLE calculations
    ADD COLUMN IF NOT EXISTS adjustments  JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS physician_id UUID  REFERENCES physician_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_calculations_physician_id ON calculations (physician_id);
