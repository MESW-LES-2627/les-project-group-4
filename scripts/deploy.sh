#!/usr/bin/env bash
# Deploy FurniMi to Vercel without a Git integration (see README "Deployment").
#
#   bash scripts/deploy.sh staging
#   source scripts/deploy.sh && furnimi production
#
# Project IDs come from .vercel/<environment>.json, created once with:
#   npx vercel link   # then cp .vercel/project.json .vercel/staging.json
# VERCEL_ORG_ID / VERCEL_PROJECT_ID override the files when set.
#
# Migrations are deliberately not run here: `prisma migrate deploy` against the
# session pooler is a separate, ordered step before deploying.

furnimi_read_id() {
  # $1 = project json file, $2 = field name
  node -e 'process.stdout.write(require(process.argv[1])[process.argv[2]] ?? "")' "$1" "$2"
}

furnimi() {
  local environment="${1:-}"
  local branch

  case "$environment" in
    production) branch=main ;;
    staging) branch=develop ;;
    *)
      echo "usage: furnimi production|staging" >&2
      return 1
      ;;
  esac

  local root file org project
  root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  file="$root/.vercel/$environment.json"

  org="${VERCEL_ORG_ID:-}"
  project="${VERCEL_PROJECT_ID:-}"

  if [ -z "$org" ] || [ -z "$project" ]; then
    if [ ! -f "$file" ]; then
      echo "Missing $file. Link the project and save its IDs first:" >&2
      echo "  npx vercel link && cp .vercel/project.json $file" >&2
      return 1
    fi
    org="${org:-$(furnimi_read_id "$file" orgId)}"
    project="${project:-$(furnimi_read_id "$file" projectId)}"
  fi

  if [ -z "$org" ] || [ -z "$project" ]; then
    echo "Could not read orgId/projectId from $file" >&2
    return 1
  fi

  local current
  current="$(git -C "$root" rev-parse --abbrev-ref HEAD)"
  if [ "$current" != "$branch" ]; then
    echo "Refusing to deploy $environment: expected branch '$branch', you are on '$current'." >&2
    return 1
  fi

  if [ -n "$(git -C "$root" status --porcelain)" ]; then
    echo "Warning: the working tree has uncommitted changes; this deployment will not match any commit." >&2
  fi

  echo "Deploying $(git -C "$root" rev-parse --short HEAD) from '$current' to furnimi-$environment"
  echo "Reminder: run 'prisma migrate deploy' against the $environment session pooler first if the schema changed."

  (
    cd "$root" &&
      VERCEL_ORG_ID="$org" VERCEL_PROJECT_ID="$project" npx vercel deploy --prod --yes
  )
}

# Only configure the shell when run as a script, so sourcing this file from
# ~/.bashrc does not change the interactive shell's options.
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  set -euo pipefail
  furnimi "$@"
fi
