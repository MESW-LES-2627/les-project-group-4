#!/usr/bin/env bash
# Apply pending Prisma migrations to a deployed Supabase database.
#
#   npm run migrate:staging
#   npm run migrate:production
#   DIRECT_DATABASE_URL=... npm run migrate:staging   # non-interactive
#
# The URL must be the session pooler (port 5432); the transaction pooler (6543)
# cannot run DDL. Nothing is read from the repository: the URL is prompted for
# (hidden) or taken from DIRECT_DATABASE_URL, and the password stays in the
# caller's environment.

furnimi_mask_url() {
  printf '%s' "$1" | sed -E 's#(://[^:]+:)[^@]*@#\1****@#'
}

furnimi_migrate() {
  local environment="${1:-}"
  local check_only="${2:-}"

  case "$environment" in
    staging | production) ;;
    *)
      echo "usage: migrate.sh staging|production [--check]" >&2
      return 1
      ;;
  esac

  [ "$check_only" = "--check" ] || check_only=""

  local root url shape
  root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  shape='^postgresql://postgres\.[a-z0-9]+:[^@]+@[a-z0-9.-]+\.pooler\.supabase\.com:5432/postgres(\?.*)?$'

  url="${DIRECT_DATABASE_URL:-}"
  if [ -z "$url" ]; then
    if [ ! -t 0 ]; then
      echo "No DIRECT_DATABASE_URL provided and stdin is not a terminal." >&2
      return 1
    fi
    read -rs -p "$environment session pooler URL: " url
    echo
  fi

  if ! [[ "$url" =~ $shape ]]; then
    echo "Rejected: this is not a Supabase session pooler URL." >&2
    echo "Expected: postgresql://postgres.<ref>:<password>@<region>.pooler.supabase.com:5432/postgres" >&2
    echo "Got:      $(furnimi_mask_url "$url")" >&2
    return 1
  fi

  echo "Environment: $environment"
  echo "Target:      $(furnimi_mask_url "$url")"
  echo "Checkout:    $(git -C "$root" rev-parse --abbrev-ref HEAD) at $(git -C "$root" rev-parse --short HEAD)"

  if [ "$check_only" = "--check" ]; then
    echo "URL shape is valid; nothing was run."
    return 0
  fi

  # A URL exported in a previous command can outlive its intent, so make the
  # caller confirm the target instead of trusting shell state.
  if [ -n "${DIRECT_DATABASE_URL:-}" ] && [ -t 0 ]; then
    local use
    read -p "Use this target? (y/N) " use
    case "$use" in
      y | Y | yes | YES) ;;
      *)
        echo "aborted" >&2
        return 1
        ;;
    esac
  fi

  if [ "$environment" = production ]; then
    local confirm
    read -p "Type 'production' to migrate the production database: " confirm
    if [ "$confirm" != production ]; then
      echo "aborted" >&2
      return 1
    fi

    if command -v pg_dump >/dev/null 2>&1; then
      local backup="$root/backup-production-$(date +%F-%H%M%S).sql"
      echo "Backing up to $(basename "$backup")"
      if ! pg_dump "$url" >"$backup"; then
        echo "Backup failed; refusing to migrate." >&2
        rm -f "$backup"
        return 1
      fi
    else
      echo "pg_dump not found: continuing without a backup" >&2
    fi
  fi

  (
    cd "$root" &&
      DIRECT_DATABASE_URL="$url" npx prisma migrate deploy &&
      DIRECT_DATABASE_URL="$url" npx prisma migrate status
  )
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  set -uo pipefail
  furnimi_migrate "$@"
fi
