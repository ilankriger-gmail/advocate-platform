# Use Input component in LoginForm

## Overview

Replace custom inline input styles in LoginForm.tsx with the reusable Input component from the UI library

## Rationale

The LoginForm uses custom inline Tailwind classes for inputs instead of the standardized Input component. This creates inconsistency and makes maintenance harder. The Input component already has proper accessibility attributes (aria-invalid, aria-describedby), error states, and consistent styling.

---
*This spec was created from ideation and is pending detailed specification.*
