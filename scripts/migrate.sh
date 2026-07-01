#!/usr/bin/env bash
# Apply Synvera SQL migrations against a chosen environment, in order.
#
# Usage:
#   scripts/migrate.sh <local|development|staging|production>
#
# DATABASE_URL is taken from the environment, or loaded from backend/.env.<env>
# (falling back to backend/.env). Production requires explicit confirmation
# (interactive prompt, or CONFIRM_PRODUCTION=true for CI).
#
# Migrations are the source of truth (see CLAUDE.md). This script does NOT
# generate or edit migrations — it only applies the committed files.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "${REPO_ROOT}/scripts/lib/guardrails.sh"

ENVIRONMENT="$(resolve_app_env "${1:-${APP_ENV:-}}")"
export APP_ENV="$ENVIRONMENT"

load_env_file "$ENVIRONMENT" "$REPO_ROOT"
announce "$ENVIRONMENT"
require_database_url
confirm_production "$ENVIRONMENT"

MIGRATIONS_DIR="${REPO_ROOT}/backend/db/migrations"
echo "Applying migrations from ${MIGRATIONS_DIR#$REPO_ROOT/} …"
shopt -s nullglob
for migration in "${MIGRATIONS_DIR}"/*.sql; do
  echo "  → $(basename "$migration")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
done
echo "✅ Migrations applied to ${ENVIRONMENT}."
