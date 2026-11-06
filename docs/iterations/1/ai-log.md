# AI Log - Iteration 1

> FurniMi · LES - Team D · FEUP 2026/27

Same rule as Iteration 0: AI was an assistant, not an author. Every
suggestion was read, changed where needed, run locally and reviewed by
another team member before it was merged.

## Tools used

| Tool             | Who       | What we used it for                                                                                                                                               |
| ---------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude           | João      | US-02 (#49), US-03 (#50) and US-15 (#56): first versions of the route handlers and tests. Help reviewing #52, #55 and #57.                                        |
| _TODO Francisca_ | Francisca | TODO                                                                                                                                                              |
| Claude           | Nicolas   | US-06b plan geometry (#47), CH-02 seed (#48) and US-07 catalog (#57): first versions of the code and tests and edge-case checks. Help reviewing #50, #52 and #53. |

### Claude

- **Route handlers and tests.** First versions of `GET /api/rooms`,
  `GET /api/rooms/[id]` (#49, #50), `GET /api/cities` and the location
  fields of `POST /api/rooms` (#56), with route tests that mock
  `@/lib/db`. João reviewed and changed them before opening the PRs.
- **Reviews.** Help running #52, #55 and #57 locally and spotting where
  they would conflict with #56.

### Claude (Nicolas)

- **Code and tests**. First versions of src/lib/geometry/plan.ts and its tests (#47), the Item/City schema, seedData.ts and the idempotent seed (#48), and GET /api/items + the /catalog page (#57). Nicolas reviewed and ran lint, typecheck, tests and build locally and changed them after review before each PR.
- **Checking the work**. Edge cases tried against the running app, and tests broken on purpose to see that they fail (mutation checks).
- **Reviews**. Help running #50, #52 and #53 locally.

## One place the model was wrong

**What the model suggested.** In US-15 (#56), the "Use my location"
callback always wrote the position into the form when the browser
answered. The tests passed, but they only checked pure helpers.

**What was wrong.** Francisca found it in review: if the user picks a
city or submits before the browser answers, the late position replaces
their choice. Server location errors (e.g. `{ cityId: "does not exist" }`)
were also silently dropped.

**What we changed.** Each lookup gets a token that picking a city
invalidates, "Create room" is disabled while a lookup is pending, and
location errors are shown on the field. All with unit tests.

**Why it matters.** Green tests said nothing about timing. For anything
asynchronous in the UI, ask "what if the user does something else before
it answers?".
