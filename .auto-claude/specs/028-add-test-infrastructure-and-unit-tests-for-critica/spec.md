# Add test infrastructure and unit tests for critical business logic

## Overview

The project has zero test files. No .test.ts, .spec.ts, or __tests__ directories exist. Critical business logic in server actions (coin transactions, reward claims, challenge participation) has no automated test coverage.

## Rationale

Without tests, refactoring is risky, bugs can slip through undetected, and there's no documentation of expected behavior. The coin/rewards system especially needs tests since financial logic bugs can cause user frustration or business losses.

---
*This spec was created from ideation and is pending detailed specification.*
