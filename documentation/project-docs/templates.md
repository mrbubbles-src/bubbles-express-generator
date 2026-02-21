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
- consistent logger bootstrap across JS/TS templates:
  - development: `pino-pretty` transport enabled
  - non-development: no custom transport object passed
- JSDoc conventions are mirrored across JS/TS templates:
  - comments describe intent + usage before implementation details
  - expected inputs and return behavior are documented on exported helpers

## TypeScript template specifics

- Node-first ESM profile (`module` + `moduleResolution` set to `nodenext`)
- strict type safety defaults for backend work:
  - `strict`
  - `exactOptionalPropertyTypes`
  - `noUncheckedIndexedAccess`
  - `noImplicitOverride`
- modern runtime assumptions (`target: es2022`, `lib: ["ES2022"]`)
- explicit module behavior (`moduleDetection: "force"`, `verbatimModuleSyntax`)
- safer transpile toolchain behavior via `isolatedModules`
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
