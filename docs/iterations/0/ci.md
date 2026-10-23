# CI - Iteration 0

> FurniMi · LES – Team D · FEUP 2026/27

The pipeline is defined in
[`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) and runs on
GitHub Actions. This document explains what it checks, why and how to
reproduce it locally before opening a pull request.

## When it runs

- On every pull request (any branch).
- On every push to `main` and `develop`.
- A newer push to the same PR or branch cancels the run already in
  progress, so only the latest commit is checked.

## Jobs

| Job        | Name in the UI                 | What it does                                                               |
| ---------- | ------------------------------ | -------------------------------------------------------------------------- |
| `changes`  | Detect changed files           | Decides whether the expensive jobs are needed.                             |
| `quality`  | Lint, typecheck and build      | Installs dependencies and checks the code.                                 |
| `database` | Migrations on a fresh database | Applies every migration to an empty PostgreSQL 16.                         |
| `ci`       | CI                             | The single required check; passes when the jobs above pass or are skipped. |

### `changes` - is this a docs-only change?

It checks out the full history and computes the changed files:

- Pull request: `origin/<base>...HEAD`.
- Push: `<before>...HEAD`; if the previous commit is unknown (first push
  or force push), it falls back to `HEAD~1...HEAD`.

If every changed file is under `docs/`, is `LICENSE`, or ends in `.md`,
the output `code` is `false` and `quality`/`database` are skipped. An
empty diff also sets `code=true`, so a run is never skipped by accident.
Anything else - source, tests, config, `package.json`, the workflow
itself - runs the full pipeline.

### `quality` - lint, typecheck, test, build

Runs on Node from [`.nvmrc`](../../../.nvmrc) (currently 22) with the npm
cache enabled:

1. `npm ci` - reproducible install; `postinstall` also generates the
   Prisma client.
2. `npm run lint` - oxlint.
3. `npm run typecheck` - `tsc --noEmit`.
4. `npm test` - Vitest (`src/**/*.test.ts`, Node environment). Unit and
   route-handler tests currently live in `src/lib/schemas/room.test.ts`
   and `src/app/api/rooms/route.test.ts`.
5. `npm run build` - the production Next.js build, which type-checks
   again.

### `database` - migrations on a fresh database

Starts `postgres:16-alpine` as a service with a health check, using
database `furnimi`, user `furnimi`, password `furnimi` on
`localhost:5432`, and sets `DATABASE_URL` to match. Then:

1. `npx prisma validate` - the schema is syntactically valid.
2. `npx prisma migrate deploy` - every migration applies cleanly to an
   empty database, the same way `npm run dev` does on start-up.
3. `npx prisma migrate diff --from-config-datasource --to-schema
prisma/schema.prisma --exit-code` - the database built from the
   migrations matches `prisma/schema.prisma`. Exit code 2 means the
   schema was edited without a migration.

This is the CI form of the "migrations apply cleanly to a fresh
database" item in [DoD.md](DoD.md).

### `ci` - the required check

`ci` depends on `changes`, `quality` and `database` with `if: always()`,
so it still runs when an earlier job fails or is skipped. It fails on
`failure` or `cancelled` and passes on `success` or `skipped`. Branch
protection should require this single check rather than the individual
jobs, so docs-only PRs are not left waiting on skipped checks.

## Reproduce it locally

| CI job                | Local command                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quality` - install   | `npm ci`                                                                                                                                            |
| `quality` - lint      | `npm run lint`                                                                                                                                      |
| `quality` - typecheck | `npm run typecheck`                                                                                                                                 |
| `quality` - tests     | `npm test`                                                                                                                                          |
| `quality` - build     | `npm run build`                                                                                                                                     |
| `database`            | `npx prisma validate && npx prisma migrate deploy && npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` |

`npm run dev` starts the Docker Postgres and applies migrations before
serving, so a local run exercises the same database path as the
`database` job. Use a disposable database when testing
`prisma migrate deploy` so you do not overwrite local data.

## Fixing common failures

- **Lint** - fix the reported file; `npm run lint` is the same command.
- **Typecheck** - `npm run typecheck` prints the errors the job saw.
- **Build** - run `npm run build`; Next.js fails on type errors and on
  invalid route/page exports.
- **Tests** - run `npm test`; add or fix the failing `*.test.ts`.
- **Migration diff** - you changed `prisma/schema.prisma` without a
  migration. Run `npm run db:migrate` with the local database up,
  commit the generated SQL, and rerun.
- **Docs-only PR shows skipped jobs** - expected; the `ci` gate still
  turns green.

## Changing the pipeline

Update `.github/workflows/ci.yml` and this document in the same pull
request. Keep `ci` as the single required check, and do
not add secrets or write permissions beyond `contents: read` without a
reason.
