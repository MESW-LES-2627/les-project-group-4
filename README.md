# FurniMi

A 2D room planner that helps people furnish a space before buying.

You enter your room's dimensions and budget. FurniMi shows furniture that fits, where it's from, and how much it costs on a top-down plan you can
drag around.

**LES - TEAM D** · FEUP - 2026/27

- Nicolas Adedoyin Ishola - up202401558@up.pt
- Francisca Vilares Portugal - up202303640@up.pt
- Francisco Tavares Ventura Barros Nunes - up201908253@up.pt
- João Francisco Costa Cordeiro - up202205682@up.pt


## Documentation

- [CLAIM iter 0](docs/iterations/0/CLAIM.md)


## Stack

- App: Next.js (React + TypeScript), with the API as route handlers under `src/app/api`
- DB: PostgreSQL (dev: Docker) with Prisma
- UI: Tailwind CSS + shadcn/ui
- 2D plan: react-three-fiber (orthographic top-down view)
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
## Structure

- src/app/ Pages and API route handlers
- src/components/ React components (ui/ holds shadcn/ui)
- src/api/ Typed client for the API
- prisma/ Schema and migrations
- docs/ Vision, MVP, stories, CLAIM, retro, AI log per iteration  
