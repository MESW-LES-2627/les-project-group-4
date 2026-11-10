# Acceptance tests

Tests that verify an acceptance test (AT) written in a story issue. They live
here instead of next to the code so that the suite reads by story, and so CI can
report which story and which AT broke.

## Layout

One directory per story, one file per AT (or a small group of related ATs):

```
tests/acceptance/US-15-set-my-location/
  AT-1-city.test.ts
  AT-2-geolocation.test.ts
  AT-3-permission-denied.test.ts
```

Unit tests stay next to the code they cover; only tests that verify an AT belong here.

## Running

```sh
npm test                      # both projects
npm test -- --project unit
```

`npm test -- --project acceptance` runs just the story tests once the first
story is migrated; the project is empty until then.

## Tags

Every acceptance test is tagged with `acceptance`, the story id and the AT id
(`US-15`, `AT-3`). AT ids are only unique inside a story, so the key is always
`US-15/AT-3` — never `AT-3` alone.

The tags, the registry that maps a story to its issue and the CI report are
added by the rest of #62 and #63.
