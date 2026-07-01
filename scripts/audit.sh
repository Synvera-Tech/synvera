#!/usr/bin/env bash
# Run Synvera's read-only audit/validation suite against an environment.
#
# Usage:
#   scripts/audit.sh <local|development|staging|production>
#
# This is READ-ONLY: it runs the engine/test suite and prints the active
# database target (masked). It never writes to the database, so it is safe in
# every environment, including production. It exists to validate that a target
# is consistent before/after migrations and seeds.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "${REPO_ROOT}/scripts/lib/guardrails.sh"

ENVIRONMENT="$(resolve_app_env "${1:-${APP_ENV:-}}")"
export APP_ENV="$ENVIRONMENT"

load_env_file "$ENVIRONMENT" "$REPO_ROOT"
announce "$ENVIRONMENT"

echo "Running backend test/audit suite (read-only) …"
( cd "${REPO_ROOT}/backend" && go test ./... )
echo "✅ Audit complete for ${ENVIRONMENT}."
