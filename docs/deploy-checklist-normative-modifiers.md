# Deploy Checklist — Normative Per-Code Modifiers (ADR-005)

Operational checklist for releasing the data-driven spine billing modifiers (roadmap N0–N5b) to
production. The anesthesiology work in this branch is **audit-only** (docs) and ships no runtime change.

## 1. Database migrations (apply in order, to the production Neon)

The engine reads `cbhpm_code_modifiers` live; **without these migrations the spine ×N rules silently
do nothing** (table empty ⇒ no modifiers). All are additive and idempotent.

- [ ] `026_spine_procedure_source.sql` — provenance columns + backfill (if not already applied).
- [ ] `027_cbhpm_code_modifiers.sql` — `CREATE TABLE cbhpm_code_modifiers`.
- [ ] `028_seed_cbhpm_code_modifiers.sql` — seed (24 CONFIRMED rows).
- [ ] `029_cbhpm_anesthetic_portes.sql` — `cbhpm_codes.anesthetic_porte` column + seed (190 codes). Required for the porte-derived anesthesiologist fee.

Apply: `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/migrations/02X_*.sql`

> **Note:** 027/028 were applied to the **dev** Neon in `backend/.env` during the session. Confirm the
> **production** database separately.

## 2. Post-migration verification (production DB)

- [ ] `SELECT count(*) FROM cbhpm_code_modifiers;` → **24**.
- [ ] Distribution: 11 PER_SEGMENT · 7 PER_VERTEBRA · 2 PER_STRUCTURE · 1 PER_STRUCTURE_DECREMENT · 3 PER_PROCEDURE.
- [ ] `SELECT count(*) FROM sbn_procedures WHERE source_document IS NOT NULL;` > 0 (026 applied).

## 3. Build / codegen integrity (CI)

- [ ] `cd backend/db && sqlc generate` → no diff (generated files committed).
- [ ] `oapi-codegen` reproduces `backend/internal/generated/openapi.gen.go` (types-only config).
- [ ] `schema.sql` matches the post-migration schema (includes `cbhpm_code_modifiers`).
- [ ] `cd backend && go build ./... && go test ./...` green.
- [ ] `cd frontend && npm run build` green.

## 4. Environment

- [ ] Backend: `DATABASE_URL` (prod Neon), Clerk vars, `PORT`.
- [ ] Frontend: `NEXT_PUBLIC_API_URL` → backend; Clerk publishable/secret keys.

## 5. Smoke test (after deploy)

- [ ] `GET /api/procedures/{spine id}` → `domain: "SPINE"` and `cbhpm_codes[].modifier` present on listed codes.
- [ ] `POST /api/calculate` with a PER_SEGMENT spine code + `quantity_selected: 3` → `quantity_multiplier: 3` (backend overrides the client `billing_mode`).
- [ ] A neurosurgery/SBN procedure: access-route panel visible, no spine controls, totals unchanged.

## 6. Behavior change summary (what this release alters)

- **Spine compositions only:** ×N per segment/vertebra/structure; costectomy 100%+30%/additional;
  bilateral no-duplication (R3); spine additional codes at 50% incl. 360° (R12). Clinically approved.
- **Neurosurgery/SBN: unchanged** (no modifier rows; engine resolves to legacy behavior).

## 7. Rollback

- [ ] Revert the deploy (previous build).
- [ ] If needed: `DROP TABLE cbhpm_code_modifiers;` — no FK points into it; no calculation/composition
  data is lost. With the table gone (or empty), the engine falls back to legacy behavior automatically.

## 8. Known-frozen (do NOT ship without separate decision)

- R14 (principal = highest porte vs highest adjusted value), R21 (anesthesia model), R22 (additive vs
  multiplicative adjustments). See [architecture/normative-engine-roadmap.md](architecture/normative-engine-roadmap.md) §6.
- Anesthesiology: audit only — see [audits/anesthesiology-rules-traceability.md](audits/anesthesiology-rules-traceability.md).
  Nothing in the engine yet; `anesthesiaFee` remains the flat reference value (R21).
