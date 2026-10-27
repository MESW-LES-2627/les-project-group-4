Closes #

## What and why

<!-- What does this change do, and which issue / MVP outcome does it serve? Link the issue. -->

## How to verify

<!-- Steps a reviewer who did not write this can follow to see it working. -->

1.

## Definition of Done (see `docs/iterations/0/DoD.md`)

- [ ] Matches the acceptance criteria of the issue and traces to an MVP outcome
- [ ] `npm run lint`, `npm run typecheck` and `npm run build` pass (CI is green)
- [ ] `npm test` passes, if the change touches code covered by tests
- [ ] Prisma migrations apply to a fresh database (`npx prisma migrate deploy`)
- [ ] Reviewed by someone other than the author
- [ ] A teammate could reproduce it from this PR alone
- [ ] Docs / `README.md` updated if behaviour, setup or commands changed
