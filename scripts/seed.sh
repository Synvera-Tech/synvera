#!/usr/bin/env bash
# Regenerate Synvera seed SQL from the canonical JSON/PDF sources.
#
# Usage:
#   scripts/seed.sh <local|development|staging>
#
# Seed regeneration runs the data/*.py generators that rebuild the committed
# seed migrations from the normative sources. This is an EXPERIMENTAL data path
# and is BLOCKED in production: production must only ever receive seeds that
# were already reviewed, committed and applied via scripts/migrate.sh.
#
# After regenerating, review the diff, commit, then apply with:
#   scripts/migrate.sh <env>

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "${REPO_ROOT}/scripts/lib/guardrails.sh"

ENVIRONMENT="$(resolve_app_env "${1:-${APP_ENV:-}}")"
export APP_ENV="$ENVIRONMENT"
announce "$ENVIRONMENT"

# Regenerating seeds from parsers must never target production.
require_non_production "$ENVIRONMENT"

echo "Regenerating seed SQL from canonical sources …"
python3 "${REPO_ROOT}/data/generate_seed.py"
python3 "${REPO_ROOT}/data/generate_code_modifiers_seed.py"
python3 "${REPO_ROOT}/data/generate_anesthetic_portes_seed.py"

echo "✅ Seed SQL regenerated. Next steps:"
echo "   1. Review the diff under backend/db/migrations/"
echo "   2. Rebuild schema.sql, run 'cd backend && sqlc generate && go test ./...'"
echo "   3. Commit, then apply with: scripts/migrate.sh ${ENVIRONMENT}"
