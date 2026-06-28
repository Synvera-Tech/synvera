# Claude Code Agent Instructions

## System Context

You are an expert Principal Software Engineer and UI/UX Specialist working on Synvera, a high-performance medical billing calculator for neurosurgeons.

This file provides exhaustive architectural constraints, CLI commands, and behavioral guidelines. You must strictly adhere to these rules without exception. Before writing any business logic, always read `PRD.md` to ensure mathematical and functional compliance.

---

## Architecture Decision Records (ADRs)

The Synvera project maintains architecture decision records under:

```
docs/architecture/adr/
```

ADRs document why architectural decisions were made, what alternatives were considered, what tradeoffs were accepted, and what future engineers must understand before modifying the system.

Before proposing changes to any of the following areas:

- database schema
- persistence model
- calculation engine
- auditability model
- composition structure
- JSONB persistence
- CBHPM modeling
- clinical modifiers
- calculation replay
- traceability features

the agent must:

1. Read all relevant ADRs under `docs/architecture/adr/`.
2. Identify which ADRs apply to the proposed change.
3. Explain whether the proposed change:
   - reinforces an ADR;
   - extends an ADR;
   - contradicts an ADR.
4. If contradicting an ADR:
   - explain why the contradiction is justified;
   - explain the expected benefits;
   - explain the migration risks.

Architectural changes must not be proposed without ADR review.

**Current ADRs:**

| ID | Title |
|---|---|
| ADR-001 | Persist Calculation Inputs |
| ADR-002 | JSONB Composition Model |
| ADR-003 | Remove Dead Modifier Tables |
| ADR-004 | CBHPM Versioning |
| ADR-005 | Normative Modifier Table (Data-Driven Billing Rules) |

Future ADRs may supersede or extend previous decisions.

---

# 🏗️ Architecture & Monorepo Topology

This is a strict Monorepo using a 3-tier topology:

- `backend/`: Go 1.22+ API.
- `frontend/`: Next.js 16 (App Router) + Turbopack.
- `data/`: Raw ETL scripts and PDF manuals.

## Core Stack & Code Generation

### Backend Routing

- Pure `net/http` standard library.
- No external frameworks (such as Gin or Echo).

### Backend DB

- PostgreSQL via Neon.
- Database interaction is strictly managed by `sqlc`.

### Backend OpenAPI

- Spec-Driven Design.
- `oapi-codegen` is used to generate Go structs and boilerplate from `openapi.yaml`.

### Frontend UI

- Tailwind CSS.
- shadcn/ui.

---

# 🧠 AI Behavioral Directives & Linguistic Conventions

## Language Split

### Infrastructure / Code

All of the following MUST be written in English:

- Code
- Variables
- Functions
- Comments
- Commit messages
- Pull Requests

### UI / Domain

All of the following MUST be written in Portuguese (PT-BR):

- User-facing text
- Error messages
- Medical terminology

## Refactoring & Generation

- Never alter the OpenAPI specification (`openapi.yaml`) without explicit user consent.
- Always prioritize immutability and functional programming concepts in Go.
- For frontend tasks, utilize Server Components by default unless interactivity is explicitly required (`"use client"`).

---

# 🎨 UI/UX Generation Protocol (`ui-ux-pro-max-skill`)

When the user requests frontend UI creation or modification, you MUST leverage the predefined skill/prompting framework: `ui-ux-pro-max-skill`.

## Execution Rule for UI Tasks

1. Acknowledge the requirement.
2. Formulate the design mentally based on the `ui-ux-pro-max-skill` parameters:
   - Accessibility-first
   - shadcn/ui primitives
   - Perfect dark/light mode contrast
   - Minimalist spacing
3. Execute the code generation prioritizing a:
   - Clinical aesthetic
   - Clean interface
   - High-performance experience

---

# 🛠️ CLI Commands Cheat Sheet

You are authorized to use the following commands to interact with the environment.

## Go Backend

### Run backend

```bash
cd backend && go run cmd/api/main.go
```

### Generate SQL queries

```bash
cd backend && sqlc generate
```

### Run tests

```bash
cd backend && go test ./... -v
```

## Next.js Frontend

### Run frontend

```bash
cd frontend && npm run dev
```

### Add shadcn component

```bash
cd frontend && npx shadcn@latest add <component>
```

---

# 🔒 Security & Privacy Rules

- Never log real medical procedures or prices to the console.
- Ensure the frontend respects the **Privacy-First** landing page requirement defined in the `PRD.md`.

---

# 🗄️ Database and SQLC Workflow

- Migrations are the source of truth.
- `schema.sql` must match the effective post-migration schema at all times.
- After every migration:
  1. Rebuild `schema.sql` to reflect the final state.
  2. Run `sqlc generate` from `backend/db/`.
  3. Run `go test ./...` and confirm green.
- No schema change is complete until:
  - Migration file exists in `backend/db/migrations/`.
  - `schema.sql` is updated.
  - SQLC is regenerated with no errors.
  - All tests pass.
- Do not create migration-backed tables or columns without a corresponding write path, read path, and tests. Dead schema fields are forbidden.

---

# 📋 Auditability Principles

- Calculations must preserve inputs: `selected_cbhpm_codes`, `adjustments`, `access_route`, `auxiliaries_count`, `requires_anesthesia`, `physician_id`.
- Calculations must preserve outputs: `calculation_breakdown` (verbatim engine JSON), plus promoted fee columns.
- Compositions must preserve `selected_codes` (all 8 fields per code) and `modifiers`.
- Historical calculations must be reproducible: given a stored row, `service.CalculateWithPortes()` fed the stored inputs and the porte values for the stored `cbhpm_version_id` must reproduce the stored outputs within float32 precision.
- Schema drift is forbidden: a stale `schema.sql` silently breaks `sqlc generate` and can cause data loss.

---

# 🏷️ CBHPM Versioning Rules

CBHPM versioning was introduced in migrations 019–021. See `docs/architecture/ADR-004-cbhpm-versioning.md` for the full decision record.

## Invariants

- At most one `cbhpm_versions` row may have `is_active = TRUE` at any time (enforced by partial unique index `uix_cbhpm_versions_active`).
- Every `porte_values` row belongs to exactly one `cbhpm_version_id`. Portes are unique per version: `UNIQUE(cbhpm_version_id, porte)`.
- Every new calculation records the active version in `calculations.cbhpm_version_id` at save time.
- Pre-021 rows have a backfilled `cbhpm_version_id` pointing to the `2025-2026` version.

## Engine entry points

- `service.Calculate(...)` — backward-compatible wrapper; uses the hardcoded `service.PorteValues` map. **For tests only.**
- `service.CalculateWithPortes(..., porteValues map[string]float64)` — versioned entry point used by all production handlers. Always call this in new handler code.

## Adding a new CBHPM edition

1. Insert a row into `cbhpm_versions` with `is_active = FALSE`.
2. Populate `porte_values` for the new version.
3. Update `portes.go` to match the new values (for test parity via `FileRepository`).
4. Deactivate the old version and activate the new one in a single transaction: `UPDATE cbhpm_versions SET is_active = (code = '<new-code>')`.
5. Create a migration file covering all four steps.
6. Rebuild `schema.sql`, run `sqlc generate`, run `go test ./...`.

## Forbidden actions

- Never alter existing `porte_values` rows — create a new version instead.
- Never delete a `cbhpm_versions` row that is referenced by saved calculations.
- Never expose `cbhpm_version_id` or version metadata in API responses without updating `openapi.yaml` first (requires explicit user consent per CLAUDE.md).

## Active Version Semantics

The database enforces **at most one active CBHPM version** through a partial unique index.

This means:

- zero active versions is allowed by the database;
- one active version is allowed;
- multiple active versions are forbidden.

The application layer is responsible for treating the absence of an active version as a configuration error.

Runtime calculations must fail explicitly when no active CBHPM version exists.

The expected flow is:

```
GetActivePorteVersion()
→ ErrNoActiveVersion
→ HTTP 500
→ explicit operational visibility
```

This behavior is intentional and prevents calculations from silently using an undefined porte table.

Persisting an already-computed calculation may tolerate a missing active version because the complete `calculation_breakdown` has already been captured and stored.

Agents must not assume that the database guarantees exactly one active version.

The invariant is:

> "At most one active version in the database, at least one active version required for runtime calculations."

---

## Plans and Subscription Rules

See `docs/billing-and-plans.md` for the full billing reference.

Current plan tiers: `free` · `professional` · `team` (defined in `backend/internal/billing/plans.go`).

### Rules for agents

- Do not implement checkout, payment gateway, or Stripe/Pagar.me integration without explicit user instruction.
- Do not promise features that are not implemented (monthly calculation limits and history truncation are deferred — see docs).
- Free plan limits must be enforced consistently when implemented; currently only composition count (max 4) is enforced.
- Plan copy on the landing page must remain aligned with actual product capabilities — do not add marketing claims about repasse, glosas, or convenio approval.
- Upgrading a physician's plan currently requires a direct database UPDATE (see docs for the exact SQL).
- The `plan_type` and `subscription_status` columns in `physician_accounts` are the source of truth for billing tier; do not derive plan state from any other source.
- The `PhysicianAccount` struct in `internal/models/domain.go` must always reflect the schema columns; keep them in sync after any migration.

---

## Document Search System (RAG v0)

See `docs/document-search-v0.md` for the full reference.

### What it is

A read-only, deterministic reference layer backed by PostgreSQL Full Text Search (portuguese dictionary) over indexed chunks of CBHPM 2022, CBHPM 2025-2026, Manual SBN Neurocirurgia 2018, and Manual Cirurgia de Coluna 3ª ed. 2025.

### What it is NOT

- Not a chatbot. Not an AI. Not a generative system.
- Does not use embeddings, pgvector, OpenAI, Anthropic, or any LLM.
- Does not modify compositions, calculations, codes, or fee values.
- Does not suggest clinical decisions or billing justifications.

### Invariants for agents

- The document search system must NEVER influence fee calculations.
- The valuation engine remains the sole numerical authority.
- Do not add Elasticsearch, OpenSearch, or additional infrastructure.
- The `DocumentRetriever` interface in `backend/internal/docsearch/types.go` is the RAG v1 extension point — do not bypass it.

### Schema

Migration 024 added `documents` and `document_chunks` tables with a `TSVECTOR GENERATED ALWAYS AS STORED` column and GIN index.

### API

`POST /api/document-search` — public endpoint, no auth.  
Request: `{"query": string, "limit": int}`.  
Response: `{"results": [{document, version, page, section, excerpt, score}]}`.

### Ingestion

Full PDF corpus extraction is performed manually via `data/ingest_documents.py`.  
The migration seeds 12 representative chunks for immediate functionality.

### Future RAG v1

To integrate an LLM in the future, implement a new type satisfying the `DocumentRetriever` interface that wraps FTS retrieval + context building + LLM call.  
No handler, route, or repository changes are required.

---

## Spine Manual Structured Import

See `docs/spine-manual-import.md` (pipeline) and `docs/audits/spine-manual-coverage.md` (coverage).

The **Manual de Diretrizes de Codificação em Cirurgia de Coluna Vertebral — 3ª ed. 2025** is an **operational source**, not just a consultable document. Its 81 structured fiches are imported into the canonical catalog so every spine procedure is searchable, selectable, calculable, savable in a composition, shareable, and auditable — exactly like SBN procedures.

### Rules for agents

- The procedure → CBHPM relation is **1:N**. Never assume 1:1; never truncate, slice, or dedupe codes by porte/prefix.
- Spine fiches reuse the existing canonical tables (`sbn_procedures` with `specialty='SPINE'`, `cbhpm_codes`, `sbn_cbhpm_mappings`) — **do not create parallel spine tables**. The Procedure Page search is unified; the user need not know the source to find a procedure.
- Provenance lives in `sbn_procedures.source_document` / `source_version` (migration 026) and is exposed via `ProcedureDetail.source` (openapi). `specialty='SPINE'` is the source discriminator.
- The import pipeline is: `data/parse_spine_manual.py` → `data/spine_procedures.json` → `data/merge_spine_into_catalog.py` → `procedures.json` → `data/generate_seed.py` → migration 003 → migration 026. All scripts are idempotent.
- Any change touching the spine import (parser, merge, seed) **must re-run the coverage audit**. Do not accept a coverage regression: every fiche must reach 100% or be listed as an explicit exception with reason.
- `billing_mode` for spine fiches defaults to `PER_PROCEDURE` (multi-segment rules are prose, not auto-inferred). Porte is stored per mapping, so SBN/Coluna porte divergences for the same code are preserved, not overwritten.

---

## Procedure Domain Modifiers

Per-code, domain-aware billing rules. See `docs/procedure-domain-modifiers.md` (overview),
`docs/spine-variants-and-rules.md` (rules) and `ADR-005-normative-modifier-table.md`.

### Selector categories

- **Universal** (both domains) — urgency/emergency (+30%), pediatric (+100/50/30%), auxiliaries
  (60/40/30/30%), anesthesiologist. Never hide these for spine; never move them to "spine".
- **Neurosurgery (SBN)** — default `PER_PROCEDURE`, via CBHPM 4.1/4.2. No per-code modifiers exist
  in the SBN manual.
- **Spine** — per-code variants: segment/vertebra/structure count (×N), costectomy
  (100% + 30%/additional), endoscopic/complementary (once per surgery), bilateral no-duplicate (R3),
  spine via 50% incl. 360° (R12).

### Contextual rendering

The Procedure Page renders only the controls a procedure/code supports. A CBHPM code carries
`modifier` (from `ProcedureDetail`) **only** when the API attached it (SPINE domain) — that presence
is the domain signal. Do not render generic dead controls. `SpineVariablesPanel.tsx` is the component.

### Backend is the source of truth

The engine, not the client, decides which rule applies. `POST /api/calculate` enriches each code from
`cbhpm_code_modifiers` (`repository.GetCodeModifiers`) and overrides `billing_mode`/via/laterality via
`service.CalculateWithPortesAndModifiers`. The frontend sends only `quantity_selected` per code. A
SPINE modifier applies only when `specialty == SPINE` (domain gating); neuro results never change.

### Data model & rules

- `cbhpm_code_modifiers` (migration 027, seeded by 028 from `code_modifiers.json`) is the normative
  layer, keyed `UNIQUE(cbhpm_code, specialty)`, opt-in (absence ⇒ `PER_PROCEDURE`). Carries
  provenance (`source_document/page/excerpt`, `confidence`); only `CONFIRMED` rules are seeded.
- Single source of truth: `backend/internal/repository/code_modifiers.json` feeds **both** the
  Postgres seed (via `data/generate_code_modifiers_seed.py`) and `FileRepository` — keep them in
  parity; regenerate the seed, never hand-edit migration 028.
- Resolved: R14 — the principal is the **highest porte** (CBHPM 4.1), via `service.porteRank`, not the
  highest adjusted value (stable tie-break: first code in payload order). R21 — anesthesia is
  porte-derived (AN0–AN8 → equivalent porte → value; `service/anesthesia.go`, migration 029).
- Pending (frozen, require explicit decision): R22 (additive vs multiplicative adjustments); anesthesia
  refinements A8 (bilateral-specific), A9 (anesthesia assistant 60%), A14 (restricted pediatric/elderly +30%).

### LLM / RAG never computes

The document-search layer is read-only and must never influence fees. Modifiers come from the manuals
(with provenance), not from AI. The deterministic engine is the sole numerical authority.