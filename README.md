# FurniMi

A 2D room planner that helps people furnish a space before buying.

You enter your room's dimensions and see the running total as you furnish it.
FurniMi shows furniture, where it's from, and how much it costs on a top-down
plan you can drag around.

**LES - TEAM D** · FEUP - 2026/27

- Nicolas Adedoyin Ishola - up202401558@up.pt
- Francisca Vilares Portugal - up202303640@up.pt
- Francisco Tavares Ventura Barros Nunes - up201908253@up.pt
- João Francisco Costa Cordeiro - up202205682@up.pt


## Documentation

- [CLAIM iter 2](docs/iterations/2/CLAIM.md)
- [CLAIM iter 1](docs/iterations/1/CLAIM.md)
- [CLAIM iter 0](docs/iterations/0/CLAIM.md)


## Stack

- App: Next.js (React + TypeScript), with the API as route handlers under `src/app/api`
- DB: PostgreSQL (dev: Docker) with Prisma
- UI: Tailwind CSS + shadcn/ui
- 2D plan view: react-three-fiber (orthographic top-down, pan/zoom)
- LLM: server side, optional

## How to run

Requires Docker and Node.js 22.

```bash
npm install   # also generates the Prisma client
npm run dev   # starts Postgres, applies migrations, serves http://localhost:3000
```

No `.env` is needed locally: without `DATABASE_URL`, the app uses the Postgres from `docker-compose.yaml`. See
[`.env.example`](.env.example) to point it somewhere else.

| Command              | What it does                                         |
|----------------------|------------------------------------------------------|
| `npm run lint`       | Lints with oxlint                                    |
| `npm run typecheck`  | Type-checks without emitting                         |
| `npm run build`      | Production build (also type-checks)                  |
| `npm run db:migrate` | Creates a migration after changing `prisma/schema.prisma` |
| `npm run db:seed`    | Fills the database with sample cities and catalog items (safe to re-run) |
| `npm run db:down`    | Stops the database                                   |

> Coming from the Spring Boot version? Its Flyway tables are still in your Docker volume. Run
> `docker compose down -v` once so Prisma can create the schema from scratch.

## Deployment

Staging and production deploy automatically on push:

| Environment | Branch    | URL |
| ----------- | --------- | --- |
| Staging     | `develop` | <https://furnimi-staging.vercel.app/> |
| Production  | `main`    | <https://furnimi-production.vercel.app/> |

A push to `develop` or `main` applies that environment's Prisma migrations against the Supabase
session pooler, then deploys the new version to Vercel. Vercel's own Git integration is not used
because installing its GitHub App requires org-owner rights; the pipeline lives in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). See
[docs/iterations/1/deployment.md](docs/iterations/1/deployment.md) for the secrets, the manual fallback and rollback.

## Structure

FurniMi uses one folder per feature. See
[docs/iterations/3/folder-structure.md](docs/iterations/3/folder-structure.md)
for the dependency rules and where new files belong.

- `src/app/` — Next.js routes, pages and route handlers (composition only)
- `src/features/` — `rooms`, `locations`, `catalog` and `plan`
- `src/components/` — shared UI: `ui/`, `form/` and `layout/`
- `src/lib/` — infrastructure: database, env, HTTP, validation and utilities
- `prisma/` — schema, migrations and `seed-data/`
- `tests/acceptance/` — acceptance tests grouped by story and AT
- `docs/` — vision, MVP, stories, CLAIM, retro, AI log and architecture
