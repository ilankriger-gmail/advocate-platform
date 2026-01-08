# Extract duplicated admin authorization pattern into reusable utility

## Overview

The admin/creator authorization check pattern is duplicated 19+ times across action files (challenges.ts, rewards.ts, events.ts). Each instance repeats the same 12-15 lines: get user, query profile for role/is_creator, check permissions, return error.

## Rationale

This massive duplication creates maintenance burden - any change to authorization logic requires modifying 19+ places. It also increases risk of inconsistent behavior and makes the codebase harder to audit for security.

---
*This spec was created from ideation and is pending detailed specification.*
