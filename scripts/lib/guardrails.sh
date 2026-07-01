#!/usr/bin/env bash
# Synvera environment guardrails — shared helpers for operational scripts.
#
# Source this file from migrate/seed/audit scripts:
#   source "$(dirname "$0")/lib/guardrails.sh"
#
# It NEVER prints credentials. It NEVER touches calculations or normative data.
# Its only job is to make the active environment explicit and to stop dangerous
# operations from hitting production by accident.

set -euo pipefail

# Resolve APP_ENV, defaulting to "local" (never production) when unset/unknown.
resolve_app_env() {
  local raw="${1:-${APP_ENV:-local}}"
  case "$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')" in
    production|prod) echo "production" ;;
    staging|stage)   echo "staging" ;;
    development|dev) echo "development" ;;
    local|"")        echo "local" ;;
    *)               echo "local" ;;
  esac
}

# Print a credential-free description of a database URL: "host=… db=…".
mask_db_target() {
  local url="${1:-}"
  if [ -z "$url" ]; then
    echo "host=(none) db=(unset)"
    return
  fi
  local tmp="${url#*://}"   # strip scheme
  tmp="${tmp##*@}"          # strip user:pass@ (everything through the last @)
  local hostport="${tmp%%/*}"
  local rest="${tmp#*/}"
  local db="${rest%%\?*}"
  [ "$rest" = "$tmp" ] && db="(default)"
  echo "host=${hostport} db=${db}"
}

# Load environment variables (DATABASE_URL, APP_ENV, …) from a file if the
# relevant variable is not already exported. Sources `backend/.env.<env>` or
# falls back to `backend/.env`. Real env vars always take precedence.
load_env_file() {
  local env="$1"
  local repo_root="$2"
  if [ -n "${DATABASE_URL:-}" ]; then
    return 0
  fi
  local candidate
  for candidate in "${repo_root}/backend/.env.${env}" "${repo_root}/backend/.env"; do
    if [ -f "$candidate" ]; then
      # shellcheck disable=SC1090
      set -a; source "$candidate"; set +a
      echo "→ loaded env from ${candidate#$repo_root/}"
      return 0
    fi
  done
}

# Announce the active environment and database target (masked) on every run.
announce() {
  local env="$1"
  echo "──────────────────────────────────────────────"
  echo " APP_ENV   : ${env}"
  echo " DB target : $(mask_db_target "${DATABASE_URL:-}")"
  echo "──────────────────────────────────────────────"
}

# Abort if the active environment is production. Use for destructive or
# experimental operations that must NEVER run against production.
require_non_production() {
  local env="$1"
  if [ "$env" = "production" ]; then
    echo "✋ Refusing to run against PRODUCTION. This operation is non-production only." >&2
    exit 1
  fi
}

# Require an explicit confirmation before touching production.
# Honors CONFIRM_PRODUCTION=true for non-interactive use (CI), otherwise prompts
# for a typed confirmation.
confirm_production() {
  local env="$1"
  [ "$env" != "production" ] && return 0
  if [ "${CONFIRM_PRODUCTION:-}" = "true" ]; then
    echo "⚠️  PRODUCTION confirmed via CONFIRM_PRODUCTION=true"
    return 0
  fi
  echo "⚠️  You are about to run against PRODUCTION ($(mask_db_target "${DATABASE_URL:-}"))." >&2
  printf 'Type the word "production" to continue: ' >&2
  local answer; read -r answer
  if [ "$answer" != "production" ]; then
    echo "Aborted." >&2
    exit 1
  fi
}

# Ensure DATABASE_URL is present before any DB operation.
require_database_url() {
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL is not set (and no backend/.env file provided it)." >&2
    exit 1
  fi
}
