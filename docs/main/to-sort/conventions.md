> THIS NEEDS UPDATING (18/09/25)

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
## Error Logging Conventions

- **Goal:** Define what constitutes a "loggable error" and establish the process for how errors are recorded in the Firestore database.

### Definition of a Loggable Error

A "loggable error" is any unexpected event that negatively impacts the application's stability, functionality, or user experience. This includes:

1.  **Critical Runtime Errors:** Any error that crashes a component, page, or server process (e.g., `auth/configuration-not-found`).
2.  **Failed AI/API Operations:** Any instance where a call to a Genkit flow or other external API fails due to a network error, timeout, or invalid response from the service.
3.  **Data Integrity Failures:** Any failed attempt to read from or write to Firestore or Firebase Storage that is not handled gracefully.
4.  **Significant UX-Breaking Bugs:** Issues that do not crash the app but prevent a key user journey from being completed (e.g., a "Save" button that fails silently).

### Logging Process

The logging process is a combination of manual and planned-for-automatic actions:

1.  **Developer-Driven Logging (Manual):** When a developer (including an AI partner) identifies and fixes a bug that meets the criteria above, it is **part of the task** to also create or update the corresponding document in the `error_definitions` collection in Firestore. This ensures our knowledge base of solved errors grows with the application.
2.  **Automated Instance Logging (To Be Implemented):** The long-term goal is to implement a global error handler within the Next.js application. This handler will automatically catch any unhandled exceptions, create a new document in the `error_instances` collection, and link it to an existing or new error definition. This provides a safety net for unanticipated errors.
