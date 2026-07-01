# Database Environments

Synvera handles **normative data and medical-financial calculations**. Production
must contain only audited, official data. This document defines the four
environments, what may enter each database, what is forbidden in production, and
the controlled commands and guardrails that enforce the boundary.

> **Principle.** Development and staging may hold test data. **Production is never
> used for experiments.** Freshly parsed PDFs, in-validation seeds, incomplete
> migrations, and un-audited normative imports must never reach production.

---

## 1. The four environments

| Environment | Database | Purpose | May contain |
|---|---|---|---|
| **local** | Docker/local Postgres, or embedded file catalog | Daily development | Disposable, throwaway data |
| **development** | Remote/persistent Neon branch `synvera_dev` | Feature integration | Experimental data |
| **staging** | Neon branch `synvera_staging` — controlled mirror of prod | Validate migrations, seeds, calculations before prod | Production-like data, no free experiments |
| **production** | Neon branch `synvera_prod` | Real usage | **Only audited data** |

### What production must contain — and only this

- validated schema
- applied, approved migrations
- audited official data: **active CBHPM**, **audited Manual SBN**, **audited
  Manual Coluna**, **audited anesthesia portes**
- real snapshots and real history

### Forbidden in production

- experimental or in-validation seeds
- incomplete migrations
- un-audited normative imports
- data produced directly by a parser/PDF extraction
- manual experiments of any kind

---

## 2. `APP_ENV`

Every tier is identified by `APP_ENV ∈ {local, development, staging, production}`.

- **Backend** reads `APP_ENV` in [`config.Load()`](../../backend/internal/config/config.go)
  and announces it at startup together with the **masked** database target
  (host + db name only — never credentials):

  ```
  Synvera API: APP_ENV=staging | host=ep-staging-xxxx.neon.tech db=synvera_staging
  ```

- Unknown or empty `APP_ENV` resolves to **`local`** — never production.
- `APP_ENV` is for operational visibility and guardrails **only**. It never
  influences calculations or the data model.
- **Frontend** uses `NEXT_PUBLIC_APP_ENV` + `NEXT_PUBLIC_API_URL` per Vercel
  environment.

---

## 3. Environment files & templates

Real secret files (`backend/.env`, `frontend/.env.local`, `frontend/.vercel/`)
are **gitignored**. Only `*.example` templates are committed.

| Tier | Backend template | Frontend template |
|---|---|---|
| (canonical) | `backend/.env.example` | `frontend/.env.local.example` |
| local | `backend/.env.local.example` | `frontend/.env.local.example` |
| development | `backend/.env.development.example` | `frontend/.env.development.example` |
| staging | `backend/.env.staging.example` | `frontend/.env.staging.example` |
| production | `backend/.env.production.example` | `frontend/.env.production.example` |

Key variables:

| Variable | Where | Notes |
|---|---|---|
| `APP_ENV` | backend | environment selector |
| `DATABASE_URL` | backend | Neon pooled connection string (per branch) |
| `PORT` | backend | defaults to 8080 |
| `CLERK_JWKS_URL`, `CLERK_ISSUER` | backend | JWT validation |
| `NEXT_PUBLIC_APP_ENV` | frontend | mirrors `APP_ENV` for the browser bundle |
| `NEXT_PUBLIC_API_URL` | frontend | backend URL for this tier |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | frontend | Clerk keys |

> A `DIRECT_DATABASE_URL` (unpooled) is **not** used today. If a future tool
> needs a direct connection, add it to the templates and this table first.

**Never commit a real `.env`.** **Never put real credentials in docs.**

---

## 4. Guardrails

Shared helpers live in [`scripts/lib/guardrails.sh`](../../scripts/lib/guardrails.sh):

- `resolve_app_env` — normalize `APP_ENV` (unknown ⇒ `local`).
- `mask_db_target` — print `host=… db=…`, never credentials.
- `announce` — print the active environment + masked target on every run.
- `require_non_production` — **abort** if `APP_ENV=production` (for experimental /
  destructive operations).
- `confirm_production` — require typed confirmation, or `CONFIRM_PRODUCTION=true`
  in CI, before any production operation.
- `require_database_url` — fail fast when no target is configured.

Enforced today:

- **Seeds regenerated from parsers** (`scripts/seed.sh`) → `require_non_production`.
- **PDF ingestion** ([`data/ingest_documents.py`](../../data/ingest_documents.py))
  → aborts when `APP_ENV=production` unless `--allow-production` is passed; always
  prints the masked target.
- **Migrations against production** (`scripts/migrate.sh`) → `confirm_production`.

---

## 5. Controlled commands

There is no migration-tracking table yet; `migrate.sh` applies **all** committed
migrations in order (intended for fresh or idempotent runs). Apply only new
migrations manually on an established database until a tracker is added.

```bash
# Migrations
scripts/migrate.sh local
scripts/migrate.sh development
scripts/migrate.sh staging
CONFIRM_PRODUCTION=true scripts/migrate.sh production   # or answer the prompt

# Seeds (regenerate seed SQL from canonical sources — non-production only)
scripts/seed.sh local
scripts/seed.sh development
scripts/seed.sh staging
# scripts/seed.sh production            → refused by design

# Audit (read-only; safe everywhere, including production)
scripts/audit.sh local
scripts/audit.sh staging
scripts/audit.sh production
```

`DATABASE_URL` is taken from the environment, or loaded from
`backend/.env.<env>` (falling back to `backend/.env`). Real env vars always win.

---

## 6. Normative data flow

Production never receives parser output directly. The audited pipeline is:

```
Official PDF
  → parser / import        (data/*.py, local/dev only)
  → local / dev database
  → audit                  (docs/audits/*, coverage 100% or explicit exception)
  → traceability matrix
  → staging                (apply migrations, validate calculations)
  → calculation validation
  → production             (approved migrations & seeds only)
```

Each step gates the next. A coverage regression or a failing calculation
validation stops promotion to production.

---

## 7. Neon / Render / Vercel

> These resources are **not** created automatically. Create them manually, then
> wire the variables below.

### Neon

Create three branches/databases from the Neon dashboard:

- `synvera_dev`
- `synvera_staging`
- `synvera_prod`

Use the **pooled** connection string for application `DATABASE_URL`. Keep the
prod branch protected; promote schema changes staging → prod via migrations.

### Render (backend, Go)

Per service (staging, production) set environment variables:

- `APP_ENV` = `staging` | `production`
- `DATABASE_URL` = the matching Neon pooled string
- `CLERK_JWKS_URL`, `CLERK_ISSUER`
- `PORT` (optional)

### Vercel (frontend, Next.js)

Map Vercel environments to branches:

| Vercel environment | Git branch | `NEXT_PUBLIC_APP_ENV` | `NEXT_PUBLIC_API_URL` |
|---|---|---|---|
| Production | `main` | `production` | prod API URL |
| Preview | `staging` | `staging` | staging API URL |
| Preview / Development | feature branches | `development` | dev API URL |

Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` per environment in
the Vercel dashboard.

---

## 8. Pre-production checklist

Before promoting anything to production:

- [ ] `cd backend && go test ./...` is green
- [ ] `schema.sql` matches the post-migration state; `sqlc generate` is clean
- [ ] Migrations applied and validated on **staging**
- [ ] Calculation validation passed on staging (engine reproduces expected fees)
- [ ] Normative imports audited (coverage 100% or explicit, documented exception)
- [ ] Exactly one active CBHPM version on the target
- [ ] No experimental/parser data in the promotion
- [ ] `frontend` builds: `npm run build` (and `lint` / `typecheck`)
- [ ] Production migration run with `CONFIRM_PRODUCTION=true` (or typed prompt)

---

## 9. Verifying the active environment

The backend logs `APP_ENV` and the masked DB target at startup (§2). A
`/api/health` endpoint that reports the environment is **deferred**: it would
require changing `openapi.yaml`, which needs explicit consent (see `CLAUDE.md`).
If added later, it must never expose secrets and should reveal the environment
name only outside production, or in a sanitized form.
