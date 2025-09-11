# Project Conventions

This document outlines the established conventions for this project to ensure consistency and maintainability.

---

## Visual Convention for Developer Tools

- **Goal:** Establish a clear and consistent visual language to distinguish developer-only UI from the main application.
- **Action:**
    1. All developer-specific components, cards, or controls will be styled with a distinctive "hazard" border.
    2. This is achieved by wrapping the developer component in a `<Card>` and applying the `bg-hazard-stripes` Tailwind utility class.
    3. This visual convention provides a clear shorthand: if a UI element has the hazard stripes, it is a developer tool.
    4. All such components MUST also be conditionally rendered using an `isDevMode` check (based on the `NEXT_PUBLIC_DEV_MODE` environment variable) to ensure they are not present in the final production build.
- **Outcome:** A simple, powerful, and unambiguous way to identify and manage developer-only features throughout the codebase.

---
