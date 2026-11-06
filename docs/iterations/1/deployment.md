# Deployment

Deploys are automatic: a push or merge to `develop` deploys **staging**, and a
push or merge to `main` deploys **production**.

Vercel's own Git integration needs the Vercel GitHub App installed at org level,
which only org owners can do, so the pipeline lives in
[`.github/workflows/deploy.yml`](../../../.github/workflows/deploy.yml) instead. Repo
admins can manage Actions secrets and environments, which makes this the
self-serve path. If the app is ever installed, the existing Vercel projects can
be connected to Git from **Project Settings → Git**, and the workflow can be
deleted.

| Environment | Trigger  | Vercel project       | Supabase project     | URL |
| ----------- | -------- | -------------------- | -------------------- | --- |
| Staging     | `develop`| `furnimi-staging`    | `furnimi-staging`    | <https://furnimi-staging.vercel.app/> |
| Production  | `main`   | `furnimi-production` | `furnimi-production` | TBD — deploys at the end of the iteration |

## What the pipeline does

1. `npm ci` on Node 22 (`.nvmrc`).
2. Fails if `DIRECT_DATABASE_URL` is missing for that environment.
3. `npx prisma migrate deploy` against the **session pooler** (port 5432). If a
   migration fails, the job stops and the previous deployment keeps serving.
4. `npm run db:seed` against the same pooler. The seed upserts by slug, so it is
   safe to run on every deploy and keeps item ids stable.
5. `vercel deploy --prod` with the environment's project ID, and exposes the
   resulting URL as the GitHub environment URL. The CLI runs with `GIT_DIR`
   pointing at a non-existent path so Vercel does not attribute the deployment
   to the commit author: this private repository is on the Hobby plan, where
   only the account owner's commits may deploy.
6. Calls `GET /api/health` on the new deployment and fails the job if it does not
   return 200 within about a minute.

Runs are serialised per branch, so two quick pushes cannot migrate the same
database at once. Preview deployments are not created for pull requests; a
reviewer sees the change on the staging URL after merge.

## One-time configuration

These are set outside the repository and must exist before the first deploy:

| Where | Name | Value |
| --- | --- | --- |
| GitHub environment `staging` | `VERCEL_TOKEN` | Vercel account token with access to team `furnimi68-9258` |
| GitHub environment `production` | `VERCEL_TOKEN` | same token, or a separate one |
| GitHub environment `staging` | `DIRECT_DATABASE_URL` | staging Supabase session pooler (5432) |
| GitHub environment `production` | `DIRECT_DATABASE_URL` | production Supabase session pooler (5432) |
| Each Vercel project, Production scope | `DATABASE_URL` | that environment's **transaction** pooler (6543) |

The Vercel project IDs are written into the workflow because they are
identifiers, not credentials. Update them if a project is recreated.

Create the GitHub environments under **Settings → Environments**. Adding
required reviewers to `production` makes a production deploy wait for approval —
useful later, but it will also block the release until someone clicks.

Secrets are write-only. Keep the connection strings in the team password
manager; rotating a Supabase password means updating both the environment secret
and `DATABASE_URL` in the matching Vercel project, then redeploying.

## Manual fallback

The scripts still work if Actions is down or you need an out-of-band deploy.
Migrations first, deploy second:

```bash
npm run migrate:staging
git switch develop && git pull
npm run deploy:staging
```

```bash
npm run migrate:production
git switch main && git pull
npm run deploy:production
```

`scripts/migrate.sh` accepts the session pooler URL only, prints the masked
target, asks for confirmation on production, and takes a `pg_dump` first.
`scripts/deploy.sh` refuses to deploy production from anything but `main` and
staging from anything but `develop`. Both are documented below for
troubleshooting.

Backups are written to the repository root as
`backup-production-<timestamp>.sql` and are gitignored.

## Verifying a deploy

1. The **Actions → Deploy** run is green and its environment URL is the expected
   project.
2. `GET /api/health` returns `200 {"status":"ok"}` (it runs `SELECT 1`).
3. Create a room, reload, and confirm the row in that environment's Supabase
   **Table Editor**.
4. Production only: **Project → Cron Jobs** lists the daily `/api/health` ping
   from `vercel.json`.

## If it fails

| Symptom | Cause | Fix |
| --- | --- | --- |
| `DIRECT_DATABASE_URL is not set for the 'develop' environment` | environment secret missing | Add it under Settings → Environments → that environment. |
| `P1001` can't reach the server | wrong pooler or port | Re-copy the **session** pooler string; `6543` and `db.<ref>.supabase.co` are rejected on purpose. |
| `P1000` authentication failed | stale password | The password was rotated but the environment secret or Vercel `DATABASE_URL` still holds the old one. |
| `Invalid token` from the Vercel CLI | token expired or revoked | Create a new token and update `VERCEL_TOKEN` in both environments. |
| Job never runs | branch is not `develop`/`main` | Use **Run workflow** (`workflow_dispatch`) or merge to the right branch. |
| Deploy succeeds but `/api/health` is 503 | `DATABASE_URL` missing in Vercel, or Supabase paused | Check the project's Production env vars; open the Supabase dashboard to resume a paused project. |
| Job is red at **Smoke test the deployment** | the new deployment does not answer `/api/health` | The deployment was already promoted before the check, so fix the cause (usually `DATABASE_URL` or a paused project) and re-run the workflow. |
| Migration applied, deploy failed | build/runtime error after migrate | Fix forward and re-run; rolling back code does not undo a migration. |

## Local database

Local development keeps using the Docker Postgres with no `.env` required:

```bash
npm run dev
```

`prisma.config.ts` falls back to `postgresql://furnimi:furnimi@localhost:5432/furnimi`
outside production. In production, a missing `DATABASE_URL` fails loudly instead.
