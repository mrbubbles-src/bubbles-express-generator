# Output Style

## Goals

- Keep the CLI visually minimal.
- Keep messages actionable and short.
- Preserve one memorable voice touch without adding visual clutter.

## Style rules

- Prefer plain line output over framed or boxed layouts.
- Keep startup output to the smallest useful context.
- Use color to group meaning (success, warning, hints), not decoration.
- Use direct language focused on what happens next.

## Interaction surfaces

### Help output

- Section-based layout:
  - `Usage`
  - `Flags`
  - `Examples`
- No decorative wrappers.

### Intro output

- Flag-driven runs: compact summary of selected stack/options.
- Interactive runs: short welcome plus one help hint.

### Safety warnings

- High-signal warning lines for destructive actions.
- Keep irreversible warnings explicit and unambiguous.

### Success output

- Include project summary fields:
  - target folder
  - language
  - database
  - package manager
- Include next-step commands.
- Include one signature line:
  - `Small scaffold. Big momentum.`

## Non-goals

- No verbose-by-default narration.
- No additional style flags or environment toggles.
