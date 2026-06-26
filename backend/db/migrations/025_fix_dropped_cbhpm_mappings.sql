-- Migration 025: Restore three SBN → CBHPM mappings silently dropped at parse time.
--
-- Root cause (see docs/audits/sbn-cbhpm-coverage.md):
-- The SBN 2018 manual renders three CBHPM codes with malformed punctuation in its
-- structured "Códigos CBHPM" tables:
--
--   p87  6.7  Cirurgia Transesfenoidal Tradicional (Sublabial)   "3.14.011.5-5" → 3.14.01.15-5
--   p89  6.9  Cirurgia Transesfenoidal Endoscópica I             "3.1.40.116-3" → 3.14.01.16-3
--   p139 9.27 Infiltração de Coluna (Dor Axial e/ou Radicular)   "3.16.0216-9"  → 3.16.02.16-9
--
-- data/generate_catalog.py's strict code regex (\d\.\d{2}\.\d{2}\.\d{2}-\d) did not
-- match those tokens, so the rows never reached procedures.json, the seed, the DB,
-- the API, or the UI. The canonical codes are confirmed by the same manual's glossary
-- (pages 12, 18) and by the official CBHPM 2022 table (pages 134, 139).
--
-- All three CBHPM codes and all three portes (14A, 11A, 3C) already exist; only the
-- per-procedure mappings were missing. This migration upserts the COMPLETE ordered
-- mapping set for each affected procedure: it inserts the missing row and normalises
-- sort_order so the UI renders codes in the manual's documented order.
--
-- Idempotent: ON CONFLICT updates sort_order/porte_code; safe to re-run.

-- ── 9.27 Infiltração de Coluna ───────────────────────────────────────────────
WITH desired (cbhpm_code, sort_order, porte_code) AS (
    VALUES
        ('4.08.13.36-3', 1, '5A'),
        ('3.16.02.16-9', 2, '3C'),   -- restored
        ('4.08.11.02-6', 3, '2B')
)
INSERT INTO sbn_cbhpm_mappings (sbn_procedure_id, cbhpm_code_id, porte_code, sort_order)
SELECT sp.id, cc.id, d.porte_code, d.sort_order
FROM   desired d
JOIN   cbhpm_codes cc    ON cc.code = d.cbhpm_code
JOIN   sbn_procedures sp ON sp.name = 'INFILTRAÇÃO DE COLUNA (DOR AXIAL E/OU RADICULAR)'
ON CONFLICT (sbn_procedure_id, cbhpm_code_id)
DO UPDATE SET sort_order = EXCLUDED.sort_order, porte_code = EXCLUDED.porte_code;

-- ── 6.7 Cirurgia Transesfenoidal Tradicional (Acesso Sublabial) ──────────────
WITH desired (cbhpm_code, sort_order, porte_code) AS (
    VALUES
        ('3.14.01.15-5', 1, '14A'),  -- restored
        ('3.14.01.16-3', 2, '11A'),
        ('3.03.02.02-1', 3, '9B'),
        ('3.05.01.20-2', 4, '8B'),
        ('3.05.02.14-4', 5, '8B'),
        ('4.08.11.02-6', 6, '2B')
)
INSERT INTO sbn_cbhpm_mappings (sbn_procedure_id, cbhpm_code_id, porte_code, sort_order)
SELECT sp.id, cc.id, d.porte_code, d.sort_order
FROM   desired d
JOIN   cbhpm_codes cc    ON cc.code = d.cbhpm_code
JOIN   sbn_procedures sp ON sp.name = 'CIRURGIA TRANSESFENOIDAL TRADICIONAL (ACESSO SUBLABIAL)'
ON CONFLICT (sbn_procedure_id, cbhpm_code_id)
DO UPDATE SET sort_order = EXCLUDED.sort_order, porte_code = EXCLUDED.porte_code;

-- ── 6.9 Cirurgia Transesfenoidal Endoscópica I ───────────────────────────────
WITH desired (cbhpm_code, sort_order, porte_code) AS (
    VALUES
        ('3.14.01.15-5', 1, '14A'),
        ('3.14.01.16-3', 2, '11A'),  -- restored
        ('3.14.01.03-1', 3, '11A'),
        ('3.03.02.02-1', 4, '9B'),
        ('3.05.01.20-2', 5, '8B')
)
INSERT INTO sbn_cbhpm_mappings (sbn_procedure_id, cbhpm_code_id, porte_code, sort_order)
SELECT sp.id, cc.id, d.porte_code, d.sort_order
FROM   desired d
JOIN   cbhpm_codes cc    ON cc.code = d.cbhpm_code
JOIN   sbn_procedures sp ON sp.name = 'CIRURGIA TRANSESFENOIDAL ENDOSCÓPICA I'
ON CONFLICT (sbn_procedure_id, cbhpm_code_id)
DO UPDATE SET sort_order = EXCLUDED.sort_order, porte_code = EXCLUDED.porte_code;
