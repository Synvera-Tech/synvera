# ADR-005: Normative Modifier Table (Data-Driven Billing Rules)

Status: Accepted (implementation deferred — see [normative-engine-roadmap.md](normative-engine-roadmap.md), stages N1–N3)

Date: 2026-06

## Context

Synvera's billing engine applies per-code billing rules — quantity multiplication
(`PER_SEGMENT`/`PER_VERTEBRA`/`PER_STRUCTURE`), laterality, and access-route discounting. Today these rules
are expressed two ways, both inadequate for an auditable clinical system:

1. **Three flat columns on `cbhpm_codes`** (`billing_mode`, `specialty`, `laterality_support`; schema.sql:78-89).
2. **Hardcoded Go logic** for via discounting and laterality (`access_routes.go`, `spine.go`, `engine.go`).

A full normative audit (see [spine-rules-traceability.md](../audits/spine-rules-traceability.md) and
[cbhpm-code-modifiers-matrix.md](../audits/cbhpm-code-modifiers-matrix.md)) proved the following gaps:

1. **No provenance.** There is nowhere to record *which manual, page, and verbatim excerpt* justifies a rule,
   nor its confidence level. Clinical/financial rules cannot be traced to a source.
2. **Incomplete data.** Only 2 of ~20 spine codes carry a non-default `billing_mode`; 0 are classified as
   `PER_VERTEBRA` or `PER_STRUCTURE`, despite the Manual de Coluna p.9 listing them explicitly.
3. **Insufficient expressiveness.** The flat `billing_mode` cannot represent parameterized rules such as
   costectomy `3.06.01.02-9` (100% + 30% per additional rib, Manual de Coluna p.13), nor distinguish
   domain-specific via rules (SPINE bills additional codes at 50% even for 360°, p.42/62, vs CBHPM 4.2's 70%).
4. **Unreliable domain discriminator.** The catalog stores `specialty="Neurocirurgia, Coluna Vertebral"`
   which does not match the `NEUROSURGERY` enum.
5. **No rule versioning.** Calculations can be replayed via the stored breakdown snapshot (ADR-001), but rules
   cannot be re-derived for a historical date.

The goal is to make the engine **data-driven**: every billable rule becomes a traceable, auditable, versionable
data row, with **no change to any calculation result** at table-creation time.

## Decision

Introduce a dedicated **normative modifier table**, `cbhpm_code_modifiers`, keyed per CBHPM code per specialty.
The table is **opt-in**: absence of a row means `PER_PROCEDURE` (×1) with default CBHPM via/laterality rules,
so neurosurgery codes require no rows and inherit current behavior.

### Why a new table (and not the existing structures)

- **Reusing `cbhpm_codes` flat columns** cannot hold provenance, confidence, or parameters (e.g. costectomy's
  30%), and conflates *what a code is* with *how it is billed*.
- **Reusing `spine_procedure_metadata`** (schema.sql:255) is wrong: it is per-procedure and informational;
  modifiers are per-code and affect the calculation.
- A dedicated table cleanly separates the **normative layer** (rules + provenance) from the **catalog layer**
  (codes + portes) and the **engine layer** (resolution logic).

### Relationship to ADR-003 (Remove Dead Modifier Tables)

ADR-003 removed modifier tables that had **no read path, no write path, and no tests** — dead schema.
This ADR does **not** contradict ADR-003; it reinforces its principle. `cbhpm_code_modifiers` will be
introduced only together with its read path (repository + engine lookup), write path (seed + tooling), and
tests (regression parity + per-rule scenarios), per CLAUDE.md. The table will **not** be merged while empty
and unread beyond the explicit, test-covered staging in the roadmap.

### Proposed schema (to be migrated in roadmap stage N1)

```sql
CREATE TABLE cbhpm_code_modifiers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cbhpm_code          VARCHAR(20) NOT NULL,
    specialty           VARCHAR(20) NOT NULL
                          CHECK (specialty IN ('NEUROSURGERY','SPINE')),
    billing_mode        VARCHAR(30) NOT NULL
                          CHECK (billing_mode IN ('PER_PROCEDURE','PER_SEGMENT',
                                 'PER_VERTEBRA','PER_STRUCTURE','PER_STRUCTURE_DECREMENT')),
    laterality_rule     VARCHAR(20) NOT NULL DEFAULT 'NONE'
                          CHECK (laterality_rule IN ('NONE','NO_DUPLICATE','BILATERAL_DOUBLE','CBHPM_4_3')),
    via_rule            VARCHAR(20) NOT NULL DEFAULT 'CBHPM_DEFAULT'
                          CHECK (via_rule IN ('CBHPM_DEFAULT','SPINE_50')),
    decrement_pct       NUMERIC(5,2),            -- for PER_STRUCTURE_DECREMENT (e.g. 30.00); NULL otherwise
    max_quantity        INT,                     -- UI cap; NULL = unbounded
    supported_modifiers JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- provenance / replay
    source_document     TEXT        NOT NULL,
    source_version      VARCHAR(40) NOT NULL,
    source_page         INT,
    source_excerpt      TEXT,
    confidence          VARCHAR(20) NOT NULL
                          CHECK (confidence IN ('CONFIRMED','INFERRED','WEAK')),
    implemented_at      TIMESTAMPTZ,
    verified_by         TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cbhpm_code, specialty)
);
```

### Cardinality (proven)

- `cbhpm_code` → modifier is **1:1 per specialty** (`UNIQUE (cbhpm_code, specialty)`), because a code may have
  different billing semantics under SPINE vs NEUROSURGERY.
- procedure → code remains **1:N** (`sbn_cbhpm_mappings`). Modifiers live on the code; **porte stays on the
  mapping** (preserving SBN×Coluna porte divergences such as `3.07.15.39-3`: 12B in COLUNA p.9 vs 12C in
  catalog). This aligns with the spine import rules in CLAUDE.md.

### Replay & versioning posture

- **Now (V1):** rely on the `calculation_breakdown` snapshot (ADR-001) for replay. The table carries provenance
  but no temporal history.
- **Future (V2):** add `valid_from`/`valid_to` or a `modifier_version_id` (analogous to `cbhpm_versions`,
  ADR-004) for rule re-derivation. The schema is forward-compatible (additional nullable columns).

## Known limitations

- The table does **not** change any calculation while it is empty or read with defaults (roadmap N1–N3).
  The first value-changing step is N5 (activate domain rules R3/R7/R12), gated by explicit clinical approval.
- Exposing modifier metadata in API responses will require an `openapi.yaml` change (explicit consent already
  granted in a prior session; re-confirm at implementation time per CLAUDE.md).
- Pending rules R14 (principal = highest porte vs highest adjusted value), R21 (anesthesia model), and R22
  (additive vs multiplicative adjustments) are **out of scope** for this ADR and remain frozen
  (see normative-engine-roadmap.md §6).

## Consequences

**Good:**
- Every billable rule becomes traceable to document/page/excerpt with a confidence level.
- The engine can be driven by data: tariff/rule corrections become seed updates, not code deploys.
- Parameterized rules (costectomy) and domain-specific rules (SPINE-50%) become representable.
- Replay-ready provenance fields are present from day one.

**Neutral:**
- The engine gains a per-code modifier lookup. For `FileRepository` this is in-memory.
- `specialty` normalization to `NEUROSURGERY`/`SPINE` becomes a prerequisite (roadmap N2).

**Watch for:**
- `schema.sql` must be rebuilt and `sqlc generate` re-run with the migration, or `sqlc` breaks (CLAUDE.md).
- The read path (N3) must prove output parity against the current engine via golden regression tests before any
  rule is activated, to guarantee "no calculation changes" until N5.
- A modifier row with a wrong `billing_mode` directly mis-prices a procedure; seed entries must carry verbatim
  provenance and be clinically verified (`verified_by`) before `implemented_at` is set.

## Supersession

This ADR extends ADR-002 (JSONB composition model) and ADR-003 (no dead modifier tables) and is independent of,
but compatible with, ADR-004 (CBHPM versioning). No prior ADR is superseded.
