-- Migration 018: Add global modifiers column to compositions.
--
-- Before this migration, spine billing variables (quantity_selected, laterality) were
-- stored redundantly inside every entry of the selected_codes JSONB array.
-- To restore a composition's spine settings the frontend had to read the first code
-- entry's quantity/laterality — an implicit, fragile coupling.
--
-- After this migration, compositions carry a top-level modifiers JSONB column that
-- holds the physician's global spine variable selections, for example:
--   {"quantity_selected": 3, "laterality": "BILATERAL"}
--
-- Existing rows receive an empty object default. The application falls back to reading
-- selected_codes[0].quantity_selected / laterality for rows that pre-date this migration
-- (the default '{}' signals "no global modifiers recorded").

ALTER TABLE compositions
    ADD COLUMN IF NOT EXISTS modifiers JSONB NOT NULL DEFAULT '{}'::jsonb;
