-- Migration 016: Remove dead modifier tables.
--
-- composition_modifiers and calculation_modifiers were created in migration 013
-- to store spine billing variables (quantity_selected, laterality) as separate rows.
-- They were superseded before any write path was implemented: those values are stored
-- per-code inside the selected_codes / selected_cbhpm_codes JSONB columns, and
-- globally inside compositions.modifiers (added in migration 018).
--
-- Zero Go code reads from or writes to these tables. Dropping them removes misleading
-- schema complexity and prevents future engineers from wiring up a dead path.

DROP TABLE IF EXISTS composition_modifiers;
DROP TABLE IF EXISTS calculation_modifiers;
