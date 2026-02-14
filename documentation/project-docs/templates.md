# Templates

## Matrix

- `js-mongo`: JavaScript + MongoDB (Mongoose)
- `js-pg`: JavaScript + PostgreSQL (Drizzle)
- `ts-mongo`: TypeScript + MongoDB (Mongoose)
- `ts-pg`: TypeScript + PostgreSQL (Drizzle)

## Common template characteristics

- `src/`-based app layout
- security middleware defaults
- input validation and auth flow starter code
- `vitest` + `supertest` test setup
- `prettier` formatting config
- `eslint` config and `lint` script

## TypeScript template specifics

- strict TypeScript config
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `typecheck` script (`tsc --noEmit` by default)

## Package-manager aware scripts

By default templates are npm-oriented.

When Bun is selected by CLI, generated project scripts are rewritten to Bun-first commands.
Test scripts still run on Vitest (`bunx vitest run` / `bunx vitest`) so generated
tests stay aligned with template test files.

## Agent instruction templates

Language-specific instruction stubs live in:

- `templates/agent-instructions/js/`
- `templates/agent-instructions/ts/`
