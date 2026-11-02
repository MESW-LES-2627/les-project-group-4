# Deployment

FurniMi deploys from a laptop, not from GitHub. The course org does not grant the
Vercel GitHub App and forking is disabled, so a push does not trigger a
deployment. Instead, two Vercel projects are bound to this directory through
`.vercel/*.json` (gitignored) and deployed by hand with `scripts/deploy.sh`.

| Environment | Vercel project      | Branch    | Supabase project     | URL |
| ----------- | ------------------- | --------- | -------------------- | --- |
| Staging     | `furnimi-staging`   | `develop` | `furnimi-staging`    | TBD |
| Production  | `furnimi-production`| `main`    | `furnimi-production` | TBD |

Connection strings live as **Secret** environment variables in Vercel. They are
write-only there, so keep a copy in the team password manager. They are never
committed.

## Database migrations

Use the migration script instead of typing a long command. It takes the
Supabase **session pooler** URL (port `5432`), never the transaction pooler
(`6543`) and never `prisma db push`: the session pooler is IPv4 and supports the
DDL and prepared statements `prisma migrate deploy` relies on.

```bash
npm run migrate:staging
npm run migrate:production
```

What the script does:

1. Reads the session pooler URL from a hidden prompt, or from
   `DIRECT_DATABASE_URL` when it is already set. When the URL comes from the
   environment, it asks you to confirm the masked target first, so a variable
   left over from an earlier command cannot silently migrate the wrong database.
2. Rejects anything that is not
   `postgresql://postgres.<ref>:<password>@<region>.pooler.supabase.com:5432/postgres`,
   so a transaction-pooler or direct-host paste fails before touching a database.
3. Prints the masked target and the current branch/commit.
4. For production, requires typing `production` and takes a `pg_dump` first. If
   the dump fails, the migration does not run.
5. Runs `prisma migrate deploy`, then `prisma migrate status`.

Validate a URL without migrating:

```bash
DIRECT_DATABASE_URL='postgresql://…' bash scripts/migrate.sh staging --check
```

Non-interactive use (a future pipeline):

```bash
DIRECT_DATABASE_URL='postgresql://…' npm run migrate:staging
```

Backups are written to the repository root as
`backup-production-<timestamp>.sql` and are gitignored. Free-tier Supabase has no
point-in-time recovery, so keep them until the deploy is verified, then move or
delete them.

### Expected output

```
Environment: staging
Target:      postgresql://postgres.<ref>:****@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
Checkout:    develop at 1a2b3c4
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-1-eu-central-1.pooler.supabase.com:5432"
...
All migrations have been successfully applied.
```

`migrate status` then ends with `Database schema is up to date!`.

## Deploying

Migrations first, deploy second. The deploy script refuses to run on the wrong
branch and warns when the working tree is dirty, because `vercel deploy` uploads
files, not a commit.

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

Environment variable changes only take effect on the next deployment. Roll back
with `npx vercel rollback <deployment-url>` or the dashboard's **Instant
Rollback**; that restores code only, never an applied migration.
