-- Migration 026: Procedure provenance columns + spine manual structured import.
--
-- Context (see docs/spine-manual-import.md and docs/audits/spine-manual-coverage.md):
-- The "Manual de Diretrizes de Codificação em Cirurgia de Coluna Vertebral — 3ª ed.
-- 2025" was previously used only for document_chunks (RAG v0) and flat specialty
-- tagging. Its 81 structured procedure fiches (1 procedure → N CBHPM codes) were
-- never imported into the operational catalog, so spine surgeries (artrodese, hérnia
-- discal, laminectomia, cirurgia endoscópica, …) were not searchable or calculable.
--
-- Migration 003 (regenerated from procedures.json) now seeds those fiches into the
-- shared canonical tables (sbn_procedures with specialty='SPINE', cbhpm_codes,
-- sbn_cbhpm_mappings). This migration adds the provenance columns that 003 cannot
-- reference (they run before it) and backfills them by specialty.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + backfill guarded by source_document IS NULL.
-- Safe to re-run; safe to apply after 003 on a fresh database or in production.

-- ── 1. Provenance columns ────────────────────────────────────────────────────
ALTER TABLE sbn_procedures
    ADD COLUMN IF NOT EXISTS source_document TEXT,
    ADD COLUMN IF NOT EXISTS source_version  VARCHAR(40);

-- ── 2. Backfill provenance by specialty ──────────────────────────────────────
-- SPINE procedures originate from the spine coding manual (3rd ed. 2025).
UPDATE sbn_procedures
SET source_document = 'Manual de Diretrizes de Codificação em Cirurgia de Coluna Vertebral',
    source_version  = '3ª ed. 2025'
WHERE specialty = 'SPINE'
  AND source_document IS NULL;

-- Every other procedure originates from the SBN neurosurgery manual (2018).
UPDATE sbn_procedures
SET source_document = 'Manual de Diretrizes de Codificação dos Procedimentos em Neurocirurgia',
    source_version  = '2018'
WHERE specialty = 'NEUROSURGERY'
  AND source_document IS NULL;
