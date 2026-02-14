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
