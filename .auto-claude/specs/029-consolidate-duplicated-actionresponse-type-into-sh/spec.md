# Consolidate duplicated ActionResponse type into shared types module

## Overview

The ActionResponse type is defined identically 5 times across action files (challenges.ts, rewards.ts, events.ts, posts.ts, profile.ts). Each definition is:
```typescript
type ActionResponse = {
  error?: string;
  success?: boolean;
  data?: any;
}
```

## Rationale

Type duplication creates inconsistency risk and maintenance burden. The `data?: any` typing also loses type safety - callers don't know what data structure to expect.

---
*This spec was created from ideation and is pending detailed specification.*
