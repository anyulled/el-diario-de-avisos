# 009: Testing and Coverage Standards

## Status

Proposed

## Context

Previous configurations in `vitest.config.ts` and `sonar-project.properties` used broad exclusions (e.g., `src/app/**`) and highly restrictive inclusion filters to artificially satisfy high coverage thresholds (90%). This led to "silent failures" where most of the codebase was not tracked for coverage, resulting in misleading SonarQube reports (0% coverage on new code).

To maintain codebase health, we need a transparent and enforceable testing standard that ensures all core logic is tracked and covered.

## Decision

1. **Global Coverage**: All source files in `src/` (excluding purely declarative files like types or static assets) must be included in coverage reports.
2. **No Broad Exclusions**: Exclusions in `sonar-project.properties` and `vitest.config.ts` must be surgical and justified. Excluding entire functional directories like `src/app` or `src/lib` is prohibited.
3. **Realistic Thresholds**: We will enforce high but realistic global thresholds in `vitest.config.ts`. If coverage falls below these levels, the build must fail.
   - Statements: 90%
   - Branches: 85% (to accommodate complex logic while maintaining quality)
   - Functions: 90%
   - Lines: 90%
4. **CI Enforcement**: The CI/CD pipeline shall enforce these thresholds. Merging code that reduces coverage below these levels is blocked by default.

## Consequences

### Positive

- **Transparency**: Coverage reports will reflect the actual state of the codebase.
- **Enforcement**: Regressions in coverage will be caught early in the development cycle.
- **Accountability**: Developers are encouraged to write tests for all new core logic.

### Negative

- **Initial Maintenance**: Some existing code may need additional tests to satisfy the global thresholds if future changes are made.
- **Rigidity**: High thresholds can sometimes lead to writing "coverage-only" tests, which should be discouraged through peer review.

## References

- [vitest.config.ts](../../vitest.config.ts)
- [sonar-project.properties](../../sonar-project.properties)
