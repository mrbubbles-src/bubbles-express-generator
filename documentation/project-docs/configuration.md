# Configuration

## CLI flags

- `--js` or `--ts`
- `--mongo` or `--pg`
- `--pm <bun|npm>`
- `--skip-install`
- `-h`, `--help`

## Generator environment variables

- `BUBBLES_PM=bun|npm`
- `BUBBLES_SKIP_INSTALL=1`

## Generated project environment variables

- `CORS_ORIGIN`: comma-separated allowed origins.
- `TRUST_PROXY=1`: applies `app.set('trust proxy', 1)` in generated app bootstrap.

## Non-interactive usage

Non-interactive runs require explicit package manager selection:

- `--pm bun|npm`, or
- `BUBBLES_PM=bun|npm`

## TypeScript template compiler defaults

Both TypeScript templates (`ts-mongo`, `ts-pg`) share a backend-focused compiler profile:

- `target: es2022` with `lib: ["ES2022"]`
- Node ESM behavior via `module` + `moduleResolution: nodenext`
- explicit module interpretation with `moduleDetection: "force"`
- stricter runtime-safety checks (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`)
- per-file transpiler compatibility through `isolatedModules`

