# Split large action files into domain-specific modules

## Overview

Three action files exceed recommended size limits: challenges.ts (588 lines), rewards.ts (533 lines), events.ts (411 lines). Each file contains both user-facing and admin actions mixed together, violating single responsibility.

## Rationale

Large files increase cognitive load, make code reviews harder, and lead to merge conflicts. Separating user actions from admin actions improves security review and enables different access patterns.

---
*This spec was created from ideation and is pending detailed specification.*
