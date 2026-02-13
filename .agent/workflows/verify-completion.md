---
description: Verification steps before reporting a task as finished
---

To avoid "misunderstandings" where a task is claimed to be finished but fails during commit, ALWAYS run the following steps:

1. **Run Project-Wide Linting**
   Ensure all files (not just modified ones) satisfy the linting rules.
   // turbo
   `npm run lint`

2. **Run TypeScript Type Check**
   Verify that there are no project-wide type mismatches, especially in interdependent modules.
   // turbo
   `npm run type-check`

3. **Verify Staged Files against Pre-commit Hooks**
   Simulate what `husky` will do during commit.
   // turbo
   `npx lint-staged`

4. **Verify Tests**
   Run the tests relevant to the changes, and if possible, a sanity check of the whole suite.
   // turbo
   `npm test`
