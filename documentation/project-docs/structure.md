# Project Structure

## Root layout

```text
bubbles-express-generator/
├─ cli/
├─ templates/
├─ tests/
├─ documentation/project-docs/
├─ README.md
├─ CHANGELOG.md
├─ package.json
└─ eslint.config.js
```

## Key directories

- `cli/`: command entrypoint and scaffolding workflow.
- `templates/`: source templates for generated apps.
- `templates/agent-instructions/js`: optional `AGENTS.md` and `CLAUDE.md` for JS scaffolds.
- `templates/agent-instructions/ts`: optional `AGENTS.md` and `CLAUDE.md` for TS scaffolds.
- `tests/`: integration tests for CLI behavior.
- `documentation/project-docs/`: maintainers' focused documentation.

## Template variants

- `templates/js-mongo`
- `templates/js-pg`
- `templates/ts-mongo`
- `templates/ts-pg`
