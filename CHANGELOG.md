# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

### Changed

## [1.2.0] - 2026-02-14

### Added

- Full package-manager support with Bun and npm selection:
  - `--pm <bun|npm>` flag
  - `BUBBLES_PM` environment override
  - non-interactive safety check requiring explicit package manager
- Bun-aware generator and scaffold behavior:
  - Bun install path and Bun-specific next-step commands
  - Bun-native script transforms in generated projects
- Optional instruction files in generated project root via interactive prompts:
  - `AGENTS.md`
  - `CLAUDE.md`
  - language-specific sourcing from `templates/agent-instructions/js` and
    `templates/agent-instructions/ts`
- ESLint support for the root project and all template projects.
- `typecheck` script for TypeScript templates.
- New focused project documentation under `documentation/project-docs/`:
  - `structure.md`
  - `cli-behavior.md`
  - `templates.md`
  - `configuration.md`
  - `testing.md`
  - `dependencies.md`
  - `output-style.md`

### Changed

- Hardening of overwrite behavior for `.` target in non-empty directories with
  explicit destructive confirmation.
- Updated README to document current CLI behavior, safety flow, Bun usage, and
  optional AGENTS/CLAUDE setup.
- TypeScript lint configuration aligned with project policy:
  `tsconfig` (`noUnusedLocals` / `noUnusedParameters`) remains source of truth
  for unused checks in TS files.
- Expanded `README.md` with:
  - installation options
  - usage examples
  - architecture/folder structure
  - configuration/env docs
  - testing/quality commands
  - contribution and license/credits sections
- Minimal-but-interesting CLI output refresh:
  - removed boxed terminal UI in favor of concise line-based messaging
  - compact one-line update notification output
  - plain help sections (`Usage`, `Flags`, `Examples`)
  - simplified intro and danger-zone copy with unchanged safety behavior
  - concise success summary with signature line:
    `Small scaffold. Big momentum.`
- Updated tests to validate the new help/success output contract.
- Updated README and project docs to match the refreshed CLI UX.
- Removed direct runtime dependency on `boxen`.
