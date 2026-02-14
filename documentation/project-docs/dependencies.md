# Dependency Notes

## Root dependencies

Runtime:

- `boxen`
- `kleur`
- `ora`
- `prompts`
- `update-notifier`

Dev:

- `eslint`
- `@eslint/js`
- `globals`
- `vitest`
- `execa`
- `fs-extra`

## Template dependencies

Core runtime libraries in generated apps include:

- `express`
- `dotenv`
- `cors`
- `helmet`
- `express-rate-limit`
- `express-validator`
- `cookie-parser`
- `jsonwebtoken`
- `bcrypt`
- `zod`

Database-specific additions:

- Mongo templates: `mongoose`
- PG templates: `drizzle-orm`, `postgres`, `drizzle-kit`

## Tooling dependencies in templates

- `eslint` + `@eslint/js`
- `prettier`
- `vitest`
- `supertest`
- TypeScript templates also include `typescript` and `@typescript-eslint/*`
