-- Migration 014: Seed billing modes and specialty for spine procedures
-- Populates billing_mode, specialty, and laterality_support columns
-- based on the spine surgery manual analysis from procedures.json.

-- Set defaults for all procedures
-- Existing procedures default to NEUROSURGERY and PER_PROCEDURE (no quantity multiplier).
UPDATE sbn_procedures
SET specialty = 'NEUROSURGERY',
    billing_mode = 'PER_PROCEDURE',
    laterality_support = false
WHERE specialty IS NULL;

-- Set specialty to SPINE for procedures identified in the spine manual.
-- These 227 procedures are specifically documented in the spine codification manual
-- and may have spine-specific billing variables.
UPDATE sbn_procedures
SET specialty = 'SPINE'
WHERE code IN (
  '1.01.01.01-2', '1.01.01.03-9', '1.01.02.01-9', '1.01.04.01-1', '1.01.05.07-7',
  '2.01.01.35-0', '2.01.03.14-0', '2.01.03.30-1', '2.01.04.10-3', '2.02.02.04-0',
  '3.02.15.02-1', '3.03.11.05-5', '3.06.01.02-9', '3.06.01.19-3', '3.07.09.01-6',
  '3.07.13.13-7', '3.07.13.14-5', '3.07.15.01-6', '3.07.15.02-4', '3.07.15.03-2',
  '3.07.15.05-9', '3.07.15.09-1', '3.07.15.10-5', '3.07.15.11-3', '3.07.15.12-1',
  '3.07.15.15-6', '3.07.15.16-4', '3.07.15.17-2', '3.07.15.18-0', '3.07.15.19-9',
  '3.07.15.20-2', '3.07.15.21-0', '3.07.15.22-9', '3.07.15.23-7', '3.07.15.24-5',
  '3.07.15.26-1', '3.07.15.27-0', '3.07.15.28-8', '3.07.15.29-6', '3.07.15.31-8',
  '3.07.15.32-6', '3.07.15.34-2', '3.07.15.35-0', '3.07.15.36-9', '3.07.15.38-5',
  '3.07.15.39-3', '3.07.15.59-8', '3.07.32.02-6', '3.09.10.13-7', '3.13.07.10-8',
  '3.14.01.10-4', '3.14.01.26-0', '3.14.03.02-6', '3.14.03.03-4', '3.14.03.12-3',
  '3.14.03.14-0', '3.14.03.21-2', '3.14.03.33-6', '3.14.05.01-0', '3.16.01.01-4',
  '3.16.02.05-3', '3.16.02.06-1', '3.16.02.07-0', '3.16.02.09-6', '3.16.02.10-0',
  '3.16.02.14-2', '3.16.02.15-0', '3.16.02.16-9', '3.16.02.17-7', '3.16.02.21-5',
  '3.16.02.22-3', '4.08.11.02-6', '4.08.13.36-3', '4.08.14.09-2', '4.08.14.10-6'
);

-- Set billing modes for procedures that use segment multipliers.
-- These procedures have explicit documentation in the spine manual indicating
-- that the billing value is multiplied by the number of segments treated.
--
-- Examples:
--   4.08.13.36-3 (Infiltração foraminal/facetária): "valor final deste código é
--     multiplicado pelo número de segmentos facetários"
--   3.14.03.33-6 (Denervação): "multiplicado pelo número de segmentos operados"
--   3.07.15.59-8 (Artroplastia discal): "multiplicado pelo número de segmentos operados"
--   2.01.03.14-0 (Bloqueio de nervo periférico): "cobrado por segmento corporal tratado"
UPDATE sbn_procedures
SET billing_mode = 'PER_SEGMENT'
WHERE code IN (
  '4.08.13.36-3',  -- Infiltração foraminal/facetária ou articular
  '3.14.03.33-6',  -- Denervação percutânea ou por radiofrequência
  '3.07.15.59-8',  -- Artroplastia discal (disc replacement)
  '2.01.03.14-0'   -- Bloqueio de nervo periférico
);

-- Enable laterality support for procedures with documented bilateral billing.
-- These procedures explicitly support bilateral (both sides) billing with pricing impact.
--
-- Examples:
--   4.08.13.36-3 (Infiltração): can be performed bilaterally (right and left)
--   3.14.03.33-6 (Denervação): can be performed bilaterally
--   2.01.03.14-0 (Bloqueio de nervo): can be performed bilaterally
UPDATE sbn_procedures
SET laterality_support = true
WHERE code IN (
  '4.08.13.36-3',  -- Infiltração foraminal/facetária (bilateral facets)
  '3.14.03.33-6',  -- Denervação (bilateral facet nerves)
  '2.01.03.14-0'   -- Bloqueio de nervo periférico (bilateral nerves)
);

-- Note: No other multipliers (osteoporosis, implant types, approach variants, etc.)
-- are applied in this release. These are stored as metadata only.
-- This ensures deterministic calculations based only on documented and explicit
-- billing rules from the spine manual.
