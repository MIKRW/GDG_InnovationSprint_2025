# Firestore Error Log Data Model

This document has been deprecated in favor of a more robust database-centric approach. The application's error log will be migrated to Firestore using the following data model. This provides better scalability, query capabilities, and data integrity.

---

## Collection 1: `error_definitions`

This collection stores the canonical master record for each type of error that has been identified and solved. The document ID serves as a unique, human-readable slug for the error.

- **Collection Path**: `error_definitions/{error_slug}`
- **Example Document ID**: `firebase-auth-config-not-found`

### Document Fields:

-   `title` (string): A short, human-readable title for the error.
    -   *Example*: "Firebase: auth/configuration-not-found"
-   `description` (string): A detailed explanation of what the error means and when it occurs.
    -   *Example*: "This error occurs when a Firebase service (like Auth or Firestore) is used before the Firebase app has been fully initialized with its configuration, particularly in a Next.js server-side rendering context."
-   `rootCause` (string): A technical analysis of the underlying reason for the error.
    -   *Example*: "A race condition in the Next.js rendering lifecycle where parts of the Firebase SDK are evaluated on the server during the build process without the explicit configuration being available."
-   `solution` (string): A detailed description of the fix that was implemented.
    -   *Example*: "The issue was resolved by implementing a robust singleton pattern in `src/lib/firebase.ts`. This ensures that Firebase is initialized only once, creating a single shared instance that is safely accessible across the entire application, whether on the client or server."
-   `occurrenceCount` (number): A counter that tracks how many times this specific error has been logged.

---

## Collection 2: `error_instances`

This collection stores a new document for every single instance of an error that occurs in the application. This provides a rich, immutable, and historical log for auditing and detailed analysis.

- **Collection Path**: `error_instances/{instance_id}`
- **Document ID**: Auto-generated unique ID.

### Document Fields:

-   `errorDefinitionId` (string): A reference to the document ID in the `error_definitions` collection. This links an instance to its master definition.
    -   *Example*: "firebase-auth-config-not-found"
-   `timestamp` (timestamp): The exact UTC timestamp of when the error occurred.
-   `context` (map): An object containing relevant contextual information about the event.
    -   *Example*: `{ "userId": "...", "pageUrl": "/record", "browser": "Chrome/120.0" }`
-   `stackTrace` (string): The full call stack captured from the error object, useful for deep debugging.

---

## Workflow for Logging a New Error

1.  When an error occurs, the application's error handling logic will determine if it matches a known type.
2.  **If it's a known error**:
    -   A new document is created in the `error_instances` collection with all the relevant instance-specific data.
    -   A Firestore transaction is used to atomically increment the `occurrenceCount` field on the corresponding document in the `error_definitions` collection.
3.  **If it's a new, unknown error**:
    -   A new document can be created in a separate `unclassified_errors` collection for developer review.
    -   Once reviewed, a developer can create a new master document in `error_definitions` and re-classify the instance.

This model provides a professional, scalable, and queryable system for managing application errors.