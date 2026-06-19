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