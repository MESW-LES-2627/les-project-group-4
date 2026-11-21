# Folder structure

This document defines where code belongs in FurniMi. It is the target layout for
**CH-04 (#65)** and the rulebook for every new file added after it.

> **Status:** target structure. The migration is tracked in
> [#65](https://github.com/MESW-LES-2627/les-project-group-4/issues/65).
> Until it lands, some files still live in the old locations. New code must use
> the paths and rules below. When a file moves, update every import and delete
> the old path: do not leave re-export shims.

The goal is simple: **one feature, one home**. A change to rooms should not send
you through `src/components/`, `src/hooks/`, `src/lib/`, `src/api/` and
`src/lib/schemas/`.

---

## Target tree

```
src/
├── app/                          # Next.js routes, pages and route handlers only
│   ├── api/
│   │   ├── cities/route.ts
│   │   ├── health/route.ts
│   │   ├── items/route.ts
│   │   └── rooms/
│   │       ├── route.ts
│   │       └── [id]/
│   │           ├── route.ts
│   │           └── layouts/
│   │               ├── route.ts
│   │               └── [layoutId]/route.ts
│   ├── catalog/
│   ├── rooms/
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.tsx
│   └── page.tsx
├── features/
│   ├── catalog/
│   │   ├── api.ts
│   │   ├── types.ts
│   │   ├── schema.ts
│   │   ├── model/
│   │   ├── server/
│   │   ├── hooks/
│   │   └── components/
│   ├── locations/
│   │   ├── types.ts
│   │   ├── schema.ts
│   │   ├── model/
│   │   ├── server/
│   │   └── components/
│   ├── plan/
│   │   ├── types.ts
│   │   ├── model/
│   │   ├── hooks/
│   │   └── components/
│   └── rooms/
│       ├── api.ts
│       ├── types.ts
│       ├── schema.ts
│       ├── model/
│       ├── server/
│       ├── hooks/
│       └── components/
├── components/                   # shared UI only
│   ├── ui/
│   ├── form/
│   └── layout/
├── lib/                          # infrastructure only
│   ├── db.ts
│   ├── env.ts
│   ├── http.ts
│   ├── validation.ts
│   └── utils.ts
└── generated/                    # Prisma client, gitignored
```

Outside `src/`:

```
prisma/
├── migrations/
├── seed-data/                    # sample cities and catalog items
├── schema.prisma
└── seed.ts

tests/
└── acceptance/
    └── <US|CH>-xx-<story>/       # acceptance tests grouped by story
        └── AT-n-*.test.ts[x]

tools/                            # repo tooling (acceptance check, deploy, migrate)
docs/                             # vision, iterations, ADRs, this document
```

---

## The five layers

### `src/app/` — delivery only

Contains only what Next.js needs: pages, layouts, error/loading/not-found files,
route handlers, global CSS and static assets.

An `app/` file may:

- read `params` and `searchParams`;
- parse input with a feature schema;
- call a feature's server function;
- return a page, a redirect, a `notFound()`, or an HTTP response.

An `app/` file must not:

- import `@/lib/db`, `@/generated/prisma` or Prisma types;
- run `getDb()`, `$queryRaw`, `$transaction` or `findMany`/`create`/`update`/`delete`;
- contain placement maths, pricing rules, validation rules or other domain logic.

If a route handler grows beyond parse → call → respond, move the work into the
owning feature's `server/` module.

### `src/features/<feature>/` — one home per feature

The four features are `rooms`, `locations`, `catalog` and `plan`. All code for a
feature lives inside its folder, including its components, hooks, pure logic,
database access, API client, types and schemas.

A feature folder may contain:

| Path | Purpose |
| --- | --- |
| `components/` | React components owned by the feature |
| `hooks/` | React hooks (`useX.ts`) |
| `model/` | Framework-free logic: calculations, placement, formatting, reducers |
| `server/` | Prisma queries and other server-only code |
| `api.ts` | Client-side calls to this feature's HTTP endpoints |
| `types.ts` | API and domain types owned by the feature |
| `schema.ts` | Zod schemas shared by the client and the server |

Not every feature needs every folder. Create a folder only when it has at least
one real file. Do not create empty scaffolding.

### `src/components/` — shared UI only

Only UI that is genuinely shared across features:

- `ui/` — shadcn/ui primitives (button, card, input, label, alert);
- `form/` — generic form fields (`FieldError`, `TextField`);
- `layout/` — app chrome (`AppHeader`).

A component used by one feature belongs in that feature's `components/`, even if
it looks generic. Moving a component here is a commitment to keep it
feature-agnostic.

`src/components/` must not import anything from `src/features/`.

### `src/lib/` — infrastructure only

A deliberately small layer:

| File | Responsibility |
| --- | --- |
| `db.ts` | Prisma client factory and database ping (`server-only`) |
| `env.ts` | database URL resolution and the local fallback |
| `http.ts` | generic JSON request and HTTP error envelope |
| `validation.ts` | generic Zod helpers (`toFieldErrors`, id schema) |
| `utils.ts` | `cn` and shared presentation helpers such as price formatting |

`src/lib/` must not import feature code. If a helper is only used by one feature,
it belongs in that feature's `model/` (or `server/` if it touches the database).

### `src/generated/` — generated, never edited

The Prisma client is generated into `src/generated/prisma/` and is gitignored.
Never edit it, never move it, and never import it from a client component. Run
`npx prisma generate` after schema changes.

---

## Feature internals in detail

### `model/` — pure logic

Framework-free code: geometry, placement, draft reducers, formatting, validation
rules. It must not import React, Next.js, Prisma or the database. Keep it easy to
unit test.

Browser-only helpers (for example `localStorage` access) may live here only if
they are side-effect free at import time and never imported by a server
component that calls them. When in doubt, keep the browser access behind a
client component or hook.

### `server/` — database access

Prisma queries, database-backed repositories and server-only orchestration. Every
module starts with:

```ts
import 'server-only'
```

Only route handlers, pages and other `server/` modules may import from
`server/`. Client components must never import it.

### `api.ts` — client calls

The browser-side functions for a feature's endpoints, built on `@/lib/http`.
Examples: `createRoom`, `listItems`, `saveLayout`.

Do not put the generic `request`/`toApiError` plumbing here; that is `lib/http.ts`.

### `types.ts` — feature contract

API request/response shapes and domain types owned by the feature. If a type is
shared by two features, decide which feature owns it and import it from there.
Only truly generic infrastructure types (`ApiError`, `ApiResult`,
`ValidationErrorBody`) live in `lib/http.ts`.

### `schema.ts` — shared validation

Zod schemas used by both the client form and the server route handler belong
here, so both sides validate the same rules. Feature-specific schema tests live
beside it.

`features/rooms/schema.ts` contains both room and saved-layout schemas. The
location part lives in `features/locations/schema.ts`; rooms imports it.

---

## Dependency rules

The allowed import directions form a DAG:

```
app        →  features, components, lib
rooms      →  locations, catalog, plan
catalog    →  plan
plan       →  (no other feature)
locations  →  (no other feature)
features   →  components/ui, components/form, lib
components →  lib
lib        →  (nothing from features or components)
```

Rules:

- **`app` may import any feature.** That is its job: composition.
- **`rooms` may import `locations`, `catalog` and `plan`.** It is the top-level
  feature: rooms own the page, saved layouts and `RoomPlan`.
- **`catalog` may import `plan`** because the catalog adds items to the current
  room's draft layout (`useDraftLayouts`). This is the only catalog → feature
  edge. `plan` must not import `catalog`; use structural types such as
  `PlacedItemSource` instead of `CatalogItem`.
- **`plan` must not import `rooms`.** `RoomPlan` lives in
  `features/rooms/components/`, not in `plan`.
- **`locations` must not import `Room` or anything from `features/rooms`.**
  Use a local structural type such as `LocatedRoom`.
- **No feature imports `src/app/`.** The app composes features, never the reverse.
- **No cycles.** A new cross-feature import that closes a cycle is not allowed.
  If you think you need one, move the shared piece down into `lib/`, a shared
  component, or a lower feature, or document the exception first.
- **Shared layers never import features.** `components/` and `lib/` must stay
  feature-agnostic.

Cross-feature server imports follow the same direction. A `server/` module may
only be imported by server code (route handlers, pages, other `server/` modules),
never by a client component.

---

## Where should a new file go?

| Kind of code | Home | Test |
| --- | --- | --- |
| Page, layout, error, loading, not-found | `src/app/**` | — |
| Route handler | `src/app/api/**/route.ts` | colocated `route.test.ts` for handler orchestration |
| React component used by one feature | `features/<feature>/components/` | colocated `*.test.tsx` once the DOM harness exists |
| React hook used by one feature | `features/<feature>/hooks/` | colocated unit test if the logic is testable |
| Calculation, placement, reducer, formatter | `features/<feature>/model/` | colocated `*.test.ts` |
| Prisma query / database repository | `features/<feature>/server/` | unit or acceptance test |
| Zod schema shared by client and server | `features/<feature>/schema.ts` | colocated schema test |
| Browser API client function | `features/<feature>/api.ts` | acceptance / route test |
| API request/response types | `features/<feature>/types.ts` | typecheck |
| Shared UI primitive | `src/components/ui/` | — |
| Generic form field | `src/components/form/` | — |
| App header / shell | `src/components/layout/` | — |
| DB client, env, generic HTTP, Zod error helpers, `cn`, price format | `src/lib/` | unit test if it has logic |
| Seed cities and catalog items | `prisma/seed-data/` | acceptance tests under `tests/acceptance/CH-02-*` |
| Acceptance test | `tests/acceptance/<story>-<slug>/AT-n-*.test.ts[x]` | tags `['acceptance', '<story>', 'AT-n']` |
| Unit test | next to the file it covers | — |

If the answer is “it is used by one feature”, it belongs in that feature. If the
answer is “it is used by two features”, put it in the owning feature and import
it along the allowed direction; only move it to `src/components/` or `src/lib/`
when it is genuinely feature-agnostic.

---

## Adding a new file: checklist

1. **Name the feature.** Is it `rooms`, `locations`, `catalog`, `plan`, shared
   UI, or infrastructure? If none fits, stop: you may be adding a new feature,
   which needs a docs update (see below).
2. **Pick the internal folder** from the table above: `components/`, `hooks/`,
   `model/`, `server/`, `api.ts`, `types.ts` or `schema.ts`.
3. **Check the dependency direction.** Does the new import create a cycle or a
   forbidden edge? If yes, move the shared piece down a layer instead.
4. **Set the runtime boundary.** Server module: add `import 'server-only'`.
   Client component: add `'use client'` only when it needs hooks, events or
   browser APIs. A module that is merely imported by a client component does not
   need the directive.
5. **Name it consistently.** Components are `PascalCase.tsx`, hooks are
   `useSomething.ts`, everything else is `camelCase.ts`. Tests are
   `*.test.ts[x]` beside the file.
6. **Add tests.** Pure logic gets a colocated unit test. A user-visible story or
   AT gets an acceptance test under `tests/acceptance/` with exactly one story
   tag and one AT tag. Manual checks go in `tests/acceptance/overrides.json`.
7. **Do not create a barrel `index.ts` by default.** Import the real module so
   the dependency graph stays readable.
8. **Run the checks:** `npm run lint`, `npm run typecheck`, `npm test`,
   `npm run build`.
9. **If the file changes the documented tree, update this document in the same
   PR.** AT-6 checks that the docs and the tree agree.

---

## Adding a new feature

A new feature is a structural change, not just a new folder. Before writing
code:

1. Agree with the team that it is a feature, and add it to this document.
2. Create `src/features/<name>/` and only the internals it needs.
3. Put the feature's `types.ts` and `schema.ts` first, then `model/`, `server/`,
   `api.ts`, `hooks/` and `components/` as they become necessary.
4. Wire it into `src/app/` through pages and route handlers. Keep the app layer
   thin.
5. Add acceptance tests under `tests/acceptance/<US|CH>-.../` and update the
   registry through `npm run acceptance:sync` if the issue is new.
6. Add the feature to the dependency rules above if it introduces a new edge.
   A new feature must not create a cycle.
7. Run the full check suite and update the tree in this document.

Until this document is updated, the feature does not have a home.

---

## Common mistakes and the right home

| Old habit | Correct home |
| --- | --- |
| `src/api/client.ts` | `src/lib/http.ts` for generic plumbing; `features/<feature>/api.ts` for endpoints |
| `src/api/types.ts` | `features/<feature>/types.ts`; generic envelope in `src/lib/http.ts` |
| `src/hooks/useSomething.ts` | `features/<feature>/hooks/useSomething.ts` |
| `src/lib/schemas/foo.ts` | `features/<feature>/schema.ts` |
| `src/lib/foo.ts` | `features/<feature>/model/foo.ts` or `features/<feature>/server/foo.ts` |
| `src/lib/geometry/` | `features/plan/model/` |
| `src/lib/layout/` | `features/plan/model/` |
| `src/lib/seedData.ts` | `prisma/seed-data/` |
| `src/components/foo/Bar.tsx` | `features/foo/components/Bar.tsx` |
| `src/components/plan/RoomPlan.tsx` | `features/rooms/components/RoomPlan.tsx` |
| `src/components/layouts/*` | `features/rooms/components/saved-layouts/*` |
| `src/components/layout/DraftLayoutsProvider.tsx` | `features/plan/components/DraftLayoutsProvider.tsx` |
| `src/components/form/LocationField.tsx` | `features/locations/components/LocationField.tsx` |
| `src/components/CreateRoomForm.tsx` | `features/rooms/components/CreateRoomForm.tsx` |

Do not “fix” a stale import by adding a re-export in the old path. Move the file
and update the importers.

---

## Tests

- **Unit tests stay next to the code.** `features/plan/model/placement.test.ts`
  covers `placement.ts`; `features/rooms/server/rooms.ts` may have a route or
  repository test beside it. Do not move colocated unit tests to `tests/`.
- **Acceptance tests stay under `tests/acceptance/`**, grouped by story:
  `tests/acceptance/US-09-add-item/AT-1-add.test.ts`. The folder and file names
  are not the traceability link; the tags are.
- A test opts in with exactly one story tag and one AT tag:
  `{ tags: ['acceptance', 'US-09', 'AT-1'] }`.
- Tests that cannot be automated are recorded in
  `tests/acceptance/overrides.json` as `manual`, `deferred` or `covered-by`.
- The registry `tests/registry.json` is generated from the GitHub issues. Do not
  hand-edit it; run `npm run acceptance:sync` when an issue's ATs change.

---

## How the structure is enforced

CH-04 adds acceptance tests that check the rules above:

| AT | What it checks |
| --- | --- |
| AT-1 — One home per feature | Feature code lives under one `src/features/<feature>/` |
| AT-2 — No behaviour change | Lint, typecheck, unit, acceptance, build and smoke tests |
| AT-3 — Thin app layer | No Prisma queries or domain logic under `src/app/` |
| AT-4 — Boundaries | No `plan → rooms`, no `locations → Room`, no client → `server-only` |
| AT-5 — Small shared layer | `src/lib` and `src/components` contain only infrastructure/shared UI |
| AT-6 — Docs match tree | This document matches the real tree and the README |

CI runs lint, typecheck, unit tests, acceptance tests and the build on every PR.
A structure violation should fail one of these checks, so do not work around it
by adding a shim or an exception; fix the placement.

---

## Quick review checklist

Before opening a PR that adds or moves code:

- [ ] Every new file has exactly one home: a feature, shared UI, `lib`, `app`,
  `prisma` or `tests/acceptance`.
- [ ] No new file was added to `src/api/`, `src/hooks/` or `src/lib/schemas/`.
- [ ] `src/app/` changes only compose; no Prisma or domain logic.
- [ ] New server modules import `server-only`; no client component imports them.
- [ ] No new feature-to-feature cycle; the allowed direction is respected.
- [ ] Pure logic has a colocated unit test.
- [ ] Story/AT changes have acceptance tests and the correct tags/registry.
- [ ] This document and `README.md` still match the tree.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.

If you are unsure where a file belongs, ask before adding it. A misplaced file
is cheaper to discuss than to move after three features depend on it.
