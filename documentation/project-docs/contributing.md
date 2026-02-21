# Contributing

## Before opening a PR

- Open an issue for bugs or feature ideas.
- Run `npm run lint` and `npm test` locally.
- Keep PRs focused; avoid mixing unrelated changes.

## JSDoc standard

- Write concise JSDoc for project helpers and template exports.
- Document intent and usage first, then expected inputs and return behavior.
- Avoid comments that only rephrase function names or line-by-line logic.

## PR description guidelines

When creating a pull request, include:

1. **Summary** – What the PR changes and why.
2. **Related issues** – Reference tickets when applicable (e.g. `Closes #123`, `Relates to #456`).
3. **Scope** – Confirm the PR is focused; call out any intentional bundling of changes.
4. **Testing** – Describe tests added/updated or explain why tests are unnecessary.

### Checklist

- [ ] `npm run lint` passes
- [ ] `npm test` passes (or describe manual verification)
