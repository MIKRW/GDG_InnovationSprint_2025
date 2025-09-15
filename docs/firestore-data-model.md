

# Firestore Data Architecture Plan

This document outlines the complete data architecture for the ChirpID application, covering developer testing, live user data, and the prompt management system. This architecture is designed to be robust, scalable, and secure.

---

## Part 1: Core App Data

### User and Species Data

*   **Collection:** `users`
    *   The top-level collection for all user-specific data.
    *   **Document ID:** `USER_UID_FROM_AUTH`
    *   **Subcollection:** `identifications`
        *   The user's personal "Bird Book". Contains a document for each saved identification.
        *   **Document (ID: `UNIQUE_LOG_ID`):** `BirdLog` object.
    *   **Subcollection:** `themes`
        *   Contains documents for each of the user's saved theme slots.

*   **Collection:** `birds`
    *   This collection stores the canonical information about each bird species. It serves as the master record.
    *   **Document ID:** `kebab-case-common-name` (e.g., `australian-magpie`)
    *   **Fields:**
        *   `commonName`, `scientificName`, `family`, `order` (string)
        *   `canonicalImageUrls`: (map) URLs for standard images.
        *   `masterAudioFiles`: (array) Metadata for master test recordings.

### Analysis & Test Run Data

These flat collections are designed for powerful querying and analysis.

*   **Collection:** `all_analysis_runs`
    *   Our comprehensive, internal log of every single analysis performed by the app in live mode.
    *   **Document (ID: `UNIQUE_RUN_ID`):** `AnalysisRun` object. This includes all inputs, AI results, and user feedback.

*   **Collection:** `all_test_runs`
    *   Contains a document for every single AI analysis run performed in developer mode using master audio files.
    *   **Document (ID: `UNIQUE_TEST_RUN_ID`):** `AnalysisRun` object, with additional test-specific context.

---

## Part 2: The Prompt Management System

This model provides a multi-tiered, version-controlled system for managing all AI prompts.

*   **Collection:** `app_ai_config`
    *   Stores the global configuration for the prompt system.
    *   **Document (ID: `main`):** A singleton document.
        *   `activeAppAIVersion`: (string) The version string of the currently live App AI Version (e.g., "v1.0").

*   **Collection:** `app_ai_versions`
    *   The highest level of versioning. Each document is a manifest of an entire "App AI" state.
    *   **Document (ID: `v1_0`):**
        *   `version`: "v1.0"
        *   `timestamp`: The time this version was published.
        *   `systems`: A map linking `systemId` to a specific `prompt_version` document ID.
            *   `bird-identifier-ai-newbie`: "bird-identifier-ai-newbie-v1-1"
            *   `theme-generator-ai`: "theme-generator-ai-v1-0"

*   **Collection:** `prompt_systems`
    *   Stores the definition for each "overarching AI system".
    *   **Document (ID: `bird-identifier-ai-newbie`):**
        *   `name`: "Bird Identifier AI (Newbie)"
        *   `description`: "Manages prompts for identifying birds in Newbie mode."
        *   `activeVersion`: "v1.1" (The currently live version for this specific system)

*   **Collection:** `prompt_versions`
    *   A historical log of every saved version of an overarching AI system.
    *   **Document (ID: `bird-identifier-ai-newbie-v1-1`):**
        *   `systemId`: "bird-identifier-ai-newbie"
        *   `version`: "v1.1"
        *   `timestamp`: The time this version was saved.
        *   `composedPrompts`: A map linking a prompt category to a specific `prompt_content` document ID.
            *   `base_instruction`: "base_instruction_v2"
            *   `location_handling`: "location_handling_v1"

*   **Collection:** `prompt_content`
    *   Stores the actual text content for every version of every individual sub-prompt.
    *   **Document (ID: `location_handling_v1`):**
        *   `systemId`: "bird-identifier-ai-newbie"
        *   `categoryId`: "location_handling"
        *   `version`: "v1.0.0"
        *   `promptText`: "If location is provided, use it as a primary factor..."
        *   `timestamp`: The time this version was saved.
        *   `previousVersionId`: (string, optional) ID of the previous version for history tracking.

---

## Part 3: Other Collections

*   **Collection:** `error_definitions` & `error_instances`
    *   Used for structured error logging as defined in `docs/ERROR_LOG.md`.

---

## Part 4: Long-Term Data Strategy

This section outlines key architectural decisions and long-term strategies for user account management and data retention.

### User Account Upgrading: Linking Anonymous to Permanent Accounts

To prevent a user's data history from being split between an anonymous account and a permanent registered account, we will implement the **anonymous user upgrade** flow provided by Firebase Authentication.

*   **Process:**
    1.  A new user starts the app and is signed in anonymously, receiving a unique anonymous UID.
    2.  They use the app, generating data (e.g., `all_analysis_runs`, `users/{anon_uid}/identifications`) associated with their anonymous UID.
    3.  When they choose to register a permanent account (e.g., with email/password), we will use the Firebase SDK to link these new credentials to their *existing* anonymous account.
*   **Benefit:** The user's UID remains the same. All their previous data is automatically and seamlessly carried over to their new, permanent account. This creates a smooth user experience and maintains data integrity.

### Data Retention & Cleanup: Managing Anonymous User Data

To manage storage costs and keep our database clean, we will implement a data retention policy for inactive or low-value anonymous user accounts. This will be achieved using scheduled Firebase Cloud Functions that run periodically.

*   **Policy for Deletion:**
    *   **Phase 1 (Short-term):** Delete anonymous user accounts and their associated data (in `users/{anon_uid}` and Firebase Storage) if the account is older than **2 weeks** AND has generated **zero** saved identifications. This removes accounts from users who visit once and never engage.
    *   **Phase 2 (Mid-term):** Delete anonymous user accounts if the account is older than **1 month** AND has generated **fewer than 5** saved identifications. This removes accounts from very low-engagement users.
    *   **Phase 3 (Long-term):** (Future Implementation) For long-term data archival, we can implement more sophisticated rules based on the `dataQualityScore` in the `all_analysis_runs` collection. For example, delete anonymous user data older than **1 year** if the average data quality score is below a certain threshold and they have not been active.
*   **Benefit:** This automated cleanup process prevents the accumulation of unused data, reducing database and storage costs while preserving valuable, high-quality data for potential future use (like AI model training).
---

## Part 4: Architectural Review & Long-Term Data Strategy

This section outlines key architectural decisions and long-term strategies to ensure the application is scalable, cost-effective, and provides a robust user experience.

### Data Value vs. Cost: The "Data Quality Score"

To manage storage costs effectively as data volume grows, a `dataQualityScore` field will be added to each document in the `all_analysis_runs` collection. This allows for intelligent data retention policies.

*   **Calculation:** The score will be calculated programmatically upon data creation, based on factors like:
    *   **AI Confidence Score:** The confidence level returned by the AI model.
    *   **User Confirmation:** Whether the user saved the identification to their personal log (a strong positive signal).
    *   **Audio Fidelity:** Higher scores for recordings made in "Twitcher Mode" with higher quality settings.
    *   **Location Precision:** Higher scores for precise GPS coordinates versus general descriptions.
    *   **Audio Clarity:** (Future enhancement) Analyze for low background noise.
*   **Benefit:** This scoring system enables automated, cost-management policies, such as deleting low-quality, un-saved recordings after a set period, while preserving high-quality data indefinitely for future AI model fine-tuning.

### Cloud Storage vs. Local Storage: User Experience & Data Persistence

To ensure a seamless, multi-device user experience and prevent data loss, the user's "Bird Book" and "Saved Themes" will be architected as cloud-first systems.

*   **Single Source of Truth:** The `users/{userId}/identifications` and `users/{userId}/themes` collections in Firestore are the user's permanent, authoritative record of their saved data.
*   **Local Cache:** The browser's `localStorage` will be used as a temporary cache for fast, offline access (e.g., for theme settings).
*   **Syncing Logic:**
    1.  On app startup, the user's data is fetched from Firestore and hydrated into the local state/cache.
    2.  When offline, the app reads from this local cache.
    3.  When a user saves a new identification or theme, the app writes it to both Firestore and the local state/cache.
*   **Benefit:** This model guarantees that a user's collection is never lost. It is always backed up to the cloud and can be accessed or restored from any device, providing the professional and reliable user experience we aim for.
