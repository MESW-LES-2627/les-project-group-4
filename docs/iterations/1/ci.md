# CI and deployment

Two GitHub Actions workflows, both in `.github/workflows/`:

- `ci.yml` — what every pull request must pass.
- `deploy.yml` — what turns a merge into a live environment.

## CI (`ci.yml`)

Runs on every pull request and on pushes to `main` and `develop`. A new push to
the same branch cancels the previous run. Documentation-only changes skip the
expensive jobs.

| Job | What it proves |
| --- | --- |
| **Detect changed files** | Decides whether the code jobs are needed; `*.md` and `docs/` alone skip them. |
| **Lint, typecheck, tests and build** | `npm ci`, `npm run lint`, `npm run typecheck`, `npm test -- --project unit`, `npm run build` on Node 22. |
| **Acceptance traceability (US/AT)** | `npm ci`, then `npm run acceptance:check` (tags, coverage, registry drift and the issue the PR closes). Runs in parallel with the acceptance tests, so the report is still produced when the mapping fails. |
| **Acceptance tests (US/AT)** | `npm ci`, the acceptance project with the JSON and JUnit reporters, and the grouped report. On pull requests it also runs the suite at the base commit to label regressions. `reports/` is uploaded as an artifact. |
| **Migrations and seed on a fresh database** | A Postgres 16 service: `prisma validate`, `migrate deploy` from an empty database, `prisma migrate diff` to prove the schema and migrations agree, then `db:seed` twice to prove seeding is idempotent. |
| **CI** | Aggregate check used for branch protection; succeeds only if the jobs above passed or were deliberately skipped. |

The `CI` check is the one to require before merging.

### Acceptance traceability

`npm run acceptance:check` runs in its own **Acceptance traceability (US/AT)**
job, in parallel with the acceptance suite, so a mapping failure does not hide
the test report. It fails when an
acceptance test file has no `US`/`AT` tags, when a test carries an unknown tag,
when a story that has started has an uncovered automated AT, or when
`tests/registry.json` no longer matches the issues. The last check reads GitHub
through `GH_TOKEN`, which is why the job declares `issues: read`.

Vitest also declares the registry tags in `vitest.config.mts` with
`strictTags`, so any `vitest` run rejects an undefined tag before this step
runs.

The check is strict by default. `--warn` reports the same gaps without failing,
for local inspection; `--strict` remains accepted for compatibility.

The job summary shows the result even when the step fails: covered/total ATs,
the uncovered ATs with issue links and a "required" flag, problems, untagged
files, registry drift, and the stories not started yet. Passing runs get the
one-line status too.

The ATs of stories nobody has started are reported but do not fail the job, so
the gate applies to work in flight rather than the whole backlog. A manual or
deferred AT is exempt when it is listed in
[`tests/acceptance/overrides.json`](../../../tests/acceptance/overrides.json).

On pull requests the check also resolves the issue the PR closes
(`gh pr view … --json closingIssuesReferences`, then `Closes #n` in the body,
then the `issue-<n>` branch name) and requires that story's ATs even before the
story has started. Every AT must be covered, `manual` or `covered-by`; a
`deferred` AT fails because the PR claims the issue is done. A PR with no
linked issue is reported and skips the rule. This needs `pull-requests: read`
in addition to `issues: read`.

### Acceptance report and regressions

The `Acceptance tests (US/AT)` job runs the acceptance project and turns the
JSON report into a summary grouped by story. The summary is collapsible and
split into **User stories** and **Chores**. Only stories that have started
appear (at least one AT with a result or an override); the rest are listed on
one line at the bottom. Failing stories are open and first in their section,
and each AT shows its result, test count and issue link. Manual, deferred and
covered-by ATs are labelled from
[`tests/acceptance/overrides.json`](../../../tests/acceptance/overrides.json).

On pull requests the job also runs the suite at the base commit in a temporary
worktree (`npm run acceptance:baseline`). The report then adds a **Change**
column:

| Change | Meaning |
| --- | --- |
| **regression** | passed on the base, fails now |
| **new test** | did not exist on the base |
| **pre-existing** | already failed on the base |
| **fixed** | failed on the base, passes now |
| **removed** | existed on the base, no longer runs |

Regressions and new failures are `::error` annotations, so they appear on the
diff; a pre-existing failure is a `::warning` because this PR did not cause it.
The baseline is best effort: it is skipped when the base has no acceptance suite
or the lockfile changed, and the report falls back to head-only results.

`reports/head.json` and `reports/acceptance.xml` are uploaded as the
`acceptance-junit` artifact, so the detailed run stays available after the
summary is gone.

The aggregate `CI` check depends on this job, so a failing acceptance test fails
the required check. If the job itself should also be required, add **Acceptance
tests (US/AT)** to the branch protection rules; the aggregate is enough today.

## Deployment (`deploy.yml`)

Vercel's Git integration is not used: it needs the Vercel GitHub App installed at
organisation level, which only org owners can do. Repo admins can manage Actions
secrets and environments, so the deploy is driven from Actions instead. If the
app is ever installed, the existing Vercel projects can be connected to Git and
this workflow removed.

| Trigger | GitHub environment | Vercel project |
| --- | --- | --- |
| push to `develop` | `staging` | `furnimi-staging` |
| push to `main` | `production` | `furnimi-production` |

Steps:

1. `npm ci` on Node 22.
2. Fail if `DIRECT_DATABASE_URL` is missing for that environment.
3. `prisma migrate deploy` against the Supabase **session pooler** (5432). A
   failed migration stops the job, so the previous deployment keeps serving.
4. `npm run db:seed` against the same pooler (CH-02 AT-7). Upserts by slug, so
   running it on every deploy is safe and item ids stay stable.
5. `vercel deploy --prod` for the environment's project ID; the deployment URL
   becomes the environment URL on GitHub.
6. `GET /api/health` on the new deployment, retried for about a minute. A
   non-200 fails the job.

Runs are serialised per branch (`concurrency`), so two quick pushes cannot
migrate the same database at once. Pull requests do not create preview
deployments; reviewers see the change on staging after merge.

### Configuration

Everything sensitive lives outside the repository:

| Where | Secret | Purpose |
| --- | --- | --- |
| GitHub environment `staging` | `VERCEL_TOKEN` | deploys the staging project |
| GitHub environment `staging` | `DIRECT_DATABASE_URL` | staging session pooler (5432) |
| GitHub environment `production` | `VERCEL_TOKEN` | deploys the production project |
| GitHub environment `production` | `DIRECT_DATABASE_URL` | production session pooler (5432) |
| Vercel project (Production scope) | `DATABASE_URL` | runtime transaction pooler (6543) |

Project identifiers (`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) are written in the
workflow because they are identifiers, not credentials. Connection strings are
kept in the team password manager.

## Releasing

The iteration release is a `develop` → `main` pull request. Merging it triggers
the production migration and deploy; there is no manual deploy step. The staging
environment is updated by every merge to `develop`.

Manual fallbacks exist for an Actions outage or a hotfix:
`npm run migrate:staging|production` and `npm run deploy:staging|production`,
documented in [`deployment.md`](deployment.md).

## Rolling back

`vercel rollback <deployment-url>` or the dashboard's **Instant Rollback**
restores the previous code. It does not undo a migration, so a destructive
migration needs a backup first; the manual migration script takes a `pg_dump`
before touching production.
