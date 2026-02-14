# CLI Behavior

## Prompt and flag model

- Language: `--js` or `--ts`.
- Database: `--mongo` or `--pg`.
- Package manager: `--pm bun|npm` or `BUBBLES_PM`.
- Skip install: `--skip-install` or `BUBBLES_SKIP_INSTALL=1`.

Package manager precedence:

1. `--pm`
2. `BUBBLES_PM`
3. Interactive prompt

In non-interactive mode, package manager must be provided by flag or env var.

## Target directory safety

Behavior when target exists and is non-empty:

- Named directory: confirm overwrite or provide a new name.
- Current directory (`.`): danger flow with three options:
  - use new project name
  - overwrite current directory
  - cancel

Overwriting `.` requires exact confirmation token:

- `DELETE_CURRENT_DIR`

If confirmation fails, setup aborts with no mutation.

## Optional instruction files

Interactive flow asks two independent questions:

- add `AGENTS.md`
- add `CLAUDE.md`

If selected, files are copied to generated project root from language-specific source:

- JS scaffold: `templates/agent-instructions/js/`
- TS scaffold: `templates/agent-instructions/ts/`

## Install execution

- npm projects: `npm install`
- Bun projects: `bun install`

Install is skipped when:

- `--skip-install` is present
- `BUBBLES_SKIP_INSTALL=1`
- test mode defaults

## Bun profile transform

When package manager is Bun, generated `package.json` is transformed:

- JS `dev`: `bun --watch src/app.js`
- TS `dev`: `bun --watch src/app.ts`
- `start`: `bun <entry>`
- `test`: `bun test`
- `test:watch`: `bun test --watch`
- `lint`: `bunx eslint .`
- TS `typecheck`: `bunx tsc --noEmit`
