# Spine Manual Structured Import

How the **Manual de Diretrizes de Codificação em Cirurgia de Coluna Vertebral — 3ª ed.
2025** is converted into searchable, calculable procedures in the operational catalog.

> The spine manual is an **operational source**, not just a consultable document. Every
> ficha must be searchable, selectable, calculable, and auditable — exactly like the SBN
> manual. See `docs/audits/spine-manual-coverage.md` for the coverage report.

---

## Source

| | |
|---|---|
| Document | Manual de Diretrizes de Codificação em Cirurgia de Coluna Vertebral |
| Edition | 3ª ed. 2025 (SBC/SBOT & SBN) |
| File | `data/raw_pdfs/Manual_De_Diretrizes_De_Codificacao_Em_Cirurgia_De_Coluna_Vertebral-3ed-2025.pdf` |
| Structure | 81 procedure fiches across 8 chapters |

Each ficha is a bordered table: `Nome do Procedimento` (N.N — TÍTULO), descrição, CIDs,
indicação, caráter, contraindicação, exames, then a **`Códigos CBHPM | Descrição | Porte`**
sub-table (one row per CBHPM code), then OPMEs / internação / etc. This is the same fiche
shape used by the SBN manual, so the import reuses the SBN modeling.

---

## Pipeline

```
PDF Coluna 3ed 2025
  │
  ├─ data/parse_spine_manual.py        pdfplumber.extract_tables → 81 fiches (1 proc → N codes)
  │     → data/spine_procedures.json    intermediate, structured, with anomalies report
  │
  ├─ data/merge_spine_into_catalog.py  append-only, idempotent merge into the canonical catalog
  │     → backend/internal/repository/procedures.json
  │
  ├─ data/generate_seed.py             aggregate by procedure_name, emit specialty
  │     → backend/db/migrations/003_seed_procedures.sql
  │
  ├─ migration 026_spine_procedure_source.sql   adds source_document/source_version + backfill
  │
  └─ banco → API (Search / GetByID) → Procedure Page (busca unificada + badge de fonte)
```

### Fields extracted

Per ficha: `procedure_number`, `name` (título — subtítulo), `source_document`,
`source_version`, and the ordered `cbhpm_codes[]`.
Per CBHPM code: `code`, `description`, `porte`, `sort_order`, `num_auxiliaries` (looked up
from the existing catalog).

---

## Modeling

Spine fiches reuse the existing canonical tables — **no parallel architecture**:

- `sbn_procedures` rows with `specialty = 'SPINE'` and provenance columns
  `source_document` / `source_version` (migration 026).
- `cbhpm_codes` for the 35 new codes (ON CONFLICT keeps existing SBN descriptions).
- `sbn_cbhpm_mappings` preserves the **1 procedure → N codes** relation, with the manual's
  `porte_code` and documented `sort_order` per mapping.

The Procedure Page searches `sbn_procedures` uniformly: the user does not need to know
whether a procedure comes from the SBN or the spine manual. A provenance badge on the
procedure detail surfaces the source manual (`ProcedureDetail.source`, openapi).

### Name collisions

Both `FileRepository.buildIndex` and `generate_seed.py` group by `procedure_name`. When a
spine ficha name collides with an existing SBN procedure:

- **identical code set** → skipped (already represented — 8 fichas administrativas);
- **differing code set** → appended with a `(Cirurgia de Coluna)` suffix so it stays a
  distinct, non-merging procedure (4 fichas).

This guarantees zero regression to SBN procedures (existing IDs/order untouched, since the
merge is append-only).

---

## Re-running the import

```bash
python3 data/parse_spine_manual.py            # PDF → data/spine_procedures.json
python3 data/merge_spine_into_catalog.py       # idempotent append → procedures.json
python3 data/generate_seed.py                  # → backend/db/migrations/003_seed_procedures.sql
cd backend/db && sqlc generate                 # regenerate sqlc models/queries
cd .. && go test ./...                          # coverage + regression tests must stay green
```

All scripts are idempotent. `merge_spine_into_catalog.py` strips previously-merged
`specialty='SPINE'` rows before re-appending, so re-running never duplicates. Migration 026
uses `ADD COLUMN IF NOT EXISTS` + backfill guarded by `source_document IS NULL`.

### Production

Migrations are applied in order via `psql` (README). Migration 003 is idempotent
(`ON CONFLICT`), so re-running the regenerated seed inserts the spine rows in production
without disturbing existing data. Migration 026 then adds and backfills the provenance
columns. No version-tracking table is involved.

---

## Limitations / future work

- **`billing_mode`** defaults to `PER_PROCEDURE` for all spine fiches. The manual's
  multi-segment billing rules (× nº de segmentos/vértebras) are described in prose and are
  not auto-inferred per code. Quantity can still be set in the UI.
- **Porte divergences** (3 codes) between the SBN and spine manuals are preserved per
  mapping; flagged in the coverage audit for clinical review.
- Richer ficha metadata (CIDs, indicação, contraindicação) is parsed into
  `data/spine_procedures.json` but **not** persisted to the DB — there is no read path yet
  (avoiding dead schema fields). Add columns + an API/UI surface before persisting.

---

## Validating a new manual in the future

1. Drop the PDF in `data/raw_pdfs/`.
2. Adapt `parse_spine_manual.py` table anchors if the fiche layout differs (verify with
   `--debug`): expect `Nome do Procedimento`, `Códigos CBHPM ... Porte`, terminating at
   `OPMEs`/`Internação`.
3. Run the pipeline above.
4. **Run the coverage audit** — every fiche must reach 100% or be listed as an explicit
   exception. Do not accept a coverage regression.
