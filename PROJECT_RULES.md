# Coding Rules & Verification Policy

To ensure high-quality code and avoid failures during the `git commit` process (managed by Husky), all AI assistants MUST follow these rules:

## 1. Mandatory Pre-Completion Verification

Before claiming a task is "finished", "done", or "complete", and before providing any final walkthrough, the assistant MUST run and pass:

- `npm run type-check`: Verifies project-wide TypeScript integrity.
- `npm run lint`: Ensures all files follow ESLint rules.
- `npm test`: Runs the test suite to ensure no regressions.

## 2. No Misunderstandings

If `type-check` or `lint` fail, the task is NOT finished. The assistant must resolve all errors and re-run the verification until it passes.

## 3. Workflow Reference

Refer to `.agent/workflows/verify-completion.md` for the specific sequence of commands.
