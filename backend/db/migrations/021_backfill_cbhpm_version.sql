-- Migration 021: Seed the initial CBHPM version and backfill existing calculations.
--
-- Steps:
--   1. Insert the CBHPM 2025/2026 version as the active version.
--   2. Seed porte_values from the existing portes table.
--   3. Add cbhpm_version_id (nullable) to calculations.
--   4. Backfill all existing calculation rows to point at the 2025-2026 version.

-- 1. Insert the CBHPM 2025/2026 version.
INSERT INTO cbhpm_versions (code, label, is_active)
VALUES ('2025-2026', 'CBHPM 2025/2026 (INPC 5,10%)', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. Seed porte_values from the legacy portes table for the new version.
INSERT INTO porte_values (cbhpm_version_id, porte, value_brl)
SELECT v.id, p.code, p.value_brl
FROM portes p
CROSS JOIN cbhpm_versions v
WHERE v.code = '2025-2026'
ON CONFLICT (cbhpm_version_id, porte) DO NOTHING;

-- 3. Add cbhpm_version_id to calculations (nullable so pre-migration rows survive).
ALTER TABLE calculations
    ADD COLUMN IF NOT EXISTS cbhpm_version_id UUID REFERENCES cbhpm_versions(id) ON DELETE SET NULL;

-- 4. Backfill existing calculations with the active version.
UPDATE calculations
SET cbhpm_version_id = (SELECT id FROM cbhpm_versions WHERE code = '2025-2026')
WHERE cbhpm_version_id IS NULL;
