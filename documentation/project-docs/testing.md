# Testing

## Root project

- `npm run test`: runs CLI integration tests.
- `npm run lint`: lints root CLI and test code.
- `bun run test:bun`: Bun-based test command for maintainers.

## CI workflow

GitHub Actions test workflow:

- runner: `ubuntu-latest`
- Node.js: `22`
- install: `npm ci`
- checks: `npm run lint` then `npm run test`

## What tests cover

- template matrix generation (`js/ts` x `mongo/pg`)
- overwrite and rename behavior
- dangerous `.` overwrite confirmation flow
- cancellation flow
- skip install behavior
- package manager behavior (`npm` and `bun`)
- optional `AGENTS.md` and `CLAUDE.md` copy flow

## Test mode behavior

Tests run with deterministic environment defaults so installs/prompts do not hang.
