# Replace excessive any types with proper TypeScript types

## Overview

Found 16+ instances of `any` type usage across the codebase, including: ActionResponse data fields, updateData objects in update functions, and type assertions (as any). This undermines TypeScript's type safety benefits.

## Rationale

Using `any` defeats the purpose of TypeScript - bugs that should be caught at compile time slip through to runtime. It also makes code harder to refactor safely and reduces IDE autocomplete/documentation benefits.

---
*This spec was created from ideation and is pending detailed specification.*
