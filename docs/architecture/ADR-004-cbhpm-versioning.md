# ADR-004: CBHPM Versioning

Status: Accepted

Date: 2026-06

## Context

The CBHPM (*Classificação Brasileira Hierarquizada de Procedimentos Médicos*) porte table defines the monetary value of each billable code. Synvera's billing engine uses these values to compute physician fees. The values are periodically revised (e.g. via INPC inflation adjustments), meaning a calculation saved today may produce a different monetary result if replayed after a tariff revision.

Before this ADR, porte values were hardcoded in `service.PorteValues` (a package-level Go map in `internal/service/portes.go`). A parallel `portes` DB table existed from migration 002 with identical values, but the engine never read from it. This meant:

1. Tariff revisions required a code deploy.
2. Historical calculations could not be replayed with the exact porte values that were in force at save time.
3. Future audits could not prove which tariff edition produced a given result.

## Decision

Introduce CBHPM versioning at the infrastructure layer without changing any clinical formulas, adjustment percentages, or API contracts.

### New tables (migrations 019–021)

**`cbhpm_versions`** — one row per CBHPM edition:
- `code` (`VARCHAR(20) UNIQUE`) — human-readable identifier, e.g. `"2025-2026"`
- `label` (`TEXT`) — display name, e.g. `"CBHPM 2025/2026 (INPC 5,10%)"`
- `is_active` (`BOOLEAN`) — at most one row may be `TRUE` (partial unique index)

**`porte_values`** — `porte → value_brl` scoped to a CBHPM version:
- `UNIQUE (cbhpm_version_id, porte)` — prevents duplicate portes per version
- Same porte may appear in multiple versions with different monetary values

**`calculations.cbhpm_version_id`** (migration 021):
- Nullable FK to `cbhpm_versions`; `NULL` for pre-migration rows
- Backfilled for all existing rows to the `2025-2026` version

### Engine change: `CalculateWithPortes`

A new function `service.CalculateWithPortes(codes, ..., porteValues map[string]float64)` was added to the calculation engine. The original `service.Calculate` function becomes a thin wrapper that passes the hardcoded `PorteValues` map.

This preserves all 50 existing test call sites without modification. New production code (handlers) calls `CalculateWithPortes` with a porte map fetched from the repository for the active version.

### Handler change: `makeCalculateHandler(repo)`

`POST /api/calculate` is now a factory function that:
1. Fetches the active CBHPM version from the repository.
2. Fetches the porte values for that version.
3. Validates submitted porte codes against the fetched map.
4. Calls `service.CalculateWithPortes` with the versioned map.

`POST /api/calculations` (save) additionally records `cbhpm_version_id` on the persisted calculation row.

### Repository interface additions

Two methods added to `repository.Repository`:
- `GetActivePorteVersion() (*models.CBHPMVersion, error)` — returns the single active version or `ErrNoActiveVersion`
- `GetPorteValues(cbhpmVersionID string) (map[string]float64, error)` — returns a `porte → value_brl` snapshot for a given version

`FileRepository` satisfies both methods using the hardcoded `service.PorteValues` map (dev/test parity).  
`PostgresRepository` satisfies both with live DB queries.

## Known limitations

- `cbhpm_version_code` and `cbhpm_version_label` are **not** exposed in the `SavedCalculation` API response because the `openapi.yaml` contract cannot be changed without explicit user consent (per CLAUDE.md). The version ID is persisted in the database and available via a direct DB query for audit purposes.
- The `portes` table (migration 002) is retained for backward compatibility. It is not used by any application code.

## Consequences

**Good:**
- Historical calculations can now be replayed deterministically using the porte values recorded at save time.
- Future tariff revisions require only a new DB row and a `cbhpm_version_id` update — no code deploy.
- All 50 existing unit tests continue to pass unchanged.
- `FileRepository` and `PostgresRepository` remain behaviorally equivalent for all versioning methods.

**Neutral:**
- `POST /api/calculate` now makes two additional DB queries per request (version + porte values). For `FileRepository` these are in-memory and effectively free.
- The `internal/db/` SQLC package was stale (referenced dropped tables); `sqlc generate` cleaned it up as a side effect.

**Watch for:**
- If the `cbhpm_versions` table has no active row, `POST /api/calculate` returns HTTP 500. Migration 021 seeds the initial active version to prevent this.
- Deactivating a version without activating another will break new calculations. The partial unique index on `is_active = TRUE` enforces at-most-one, but not at-least-one.

## Active Version Semantics

The CBHPM version model intentionally separates database guarantees from application guarantees.

The database uses a partial unique index on active versions.

This guarantees:

- zero active versions
- one active version

and prevents:

- multiple active versions

The database therefore enforces "at most one active version" rather than "exactly one active version".

The application layer is responsible for enforcing runtime requirements.

When no active version exists:

- `GetActivePorteVersion()` returns `ErrNoActiveVersion`
- runtime calculations fail
- operators receive explicit visibility of the configuration problem

This design was chosen because:

- database constraints should prevent invalid coexistence of active versions;
- operational mistakes should surface explicitly;
- historical calculations must never silently fall back to an arbitrary porte table.

The distinction between database invariant and runtime invariant is intentional.

**Database invariant:**

> "There may never be more than one active CBHPM version."

**Runtime invariant:**

> "A calculation requires one active CBHPM version."
