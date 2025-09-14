
# Firestore Data Architecture Plan

This document outlines the complete data architecture for the ChirpID application, covering both developer testing and live user data. This architecture is designed to be robust, scalable, and secure.

---

## Part 1: The Developer/Test Data Model

This model is designed for our internal, controlled testing. It is structured around a single, flat collection that allows for powerful cross-species querying and analysis. To enable efficient searching and filtering by scientific classification, each test run document will include the bird's taxonomic family and order.

*   **Top-Level Collection:** `birds`
    *   This collection stores the canonical information about each bird species. It serves as the master record.
    *   **Document:** `birds/australian-magpie`
        *   `commonName`: "Australian Magpie"
        *   `scientificName`: "Gymnorhina tibicen"
        *   `family`: "Artamidae"
        *   `order`: "Passeriformes"
        *   `canonicalImageUrls`: (map) A collection of URLs for standard images.
            *   `key`: "https://firebasestorage.googleapis.com/..." (The primary, clearest image)
            *   `side_profile`: "https://firebasestorage.googleapis.com/..."
            *   `male`: "https://firebasestorage.googleapis.com/..."
            *   `female`: "https://firebasestorage.googleapis.com/..."
        *   `masterAudioFiles`: An array of metadata for the master test recordings.
            *   `audioId`: "magpie-warble-1"
            *   `storagePath`: "master-audio/magpie-warble-1.wav"
            *   `description`: "The sound of a magpie in Fryers Forest."
            *   ... other metadata like author, license, etc.

*   **Top-Level Collection:** `all_test_runs`
    *   This flat collection contains a document for every single AI analysis run performed in developer mode.
    *   **Document (ID: `UNIQUE_TEST_RUN_ID`):**
        *   `birdId`: "australian-magpie" (links to the `birds` collection)
        *   `testAudioId`: "magpie-warble-1" (identifies which master audio was used)
        *   `timestamp`: The time of the analysis.
        *   `promptVersion`: The version of the AI prompt used.
        *   `aiResult`: The full, raw output from the AI model.
        *   `wasSuccessful`: A boolean indicating if the AI correctly identified the bird.

*   **Top-Level Collection:** `prompt_systems`
    *   Stores the high-level definition for each "overarching AI".
    *   **Document (ID: `bird-identifier-ai`):**
        *   `name`: "Bird Identifier AI"
        *   `description`: "Manages all prompts related to identifying birds from audio."
        *   `activeVersion`: "v1.1" (The currently live version of this AI system)

*   **Top-Level Collection:** `prompt_versions`
    *   A historical log of every saved version of an overarching AI.
    *   **Document (ID: `bird-identifier-ai-v1.1`):**
        *   `systemId`: "bird-identifier-ai"
        *   `version`: "v1.1"
        *   `timestamp`: The time this version was saved.
        *   `composedPrompts`: A map linking prompt categories to specific prompt content versions.
            *   `base_instruction`: "prompt_content/base_instruction_v1.0"
            *   `location_handling`: "prompt_content/location_handling_v1.2"
            *   `weather_handling`: "prompt_content/weather_handling_v1.1"

*   **Top-Level Collection:** `prompt_content`
    *   Stores the actual text content for every version of every sub-prompt.
    *   **Document (ID: `location_handling_v1.2`):**
        *   `systemId`: "bird-identifier-ai"
        *   `categoryId`: "location_handling"
        *   `version`: "v1.2"
        *   `promptText`: "If location is provided, use it as a primary factor..."
        *   `previousVersionId`: "location_handling_v1.1" (for historical tracking)

---

## Part 2: The Live User Data Model

This professional, two-tiered model perfectly separates our need for analytical data from the user's control over their personal log.

*   **Tier 1: The Internal Analysis Log (Invisible to Users)**
    *   This collection is our comprehensive, internal log of every single analysis performed by the app. It uses a flat structure for maximum query flexibility.
    *   **Top-Level Collection:** `all_analysis_runs`
        *   **Document (ID: `UNIQUE_RUN_ID`):**
            *   `timestamp`: The time of the analysis.
            *   `userId`: The user's unique ID from Firebase Auth.
            *   `sessionId`: A UUID to group multiple analyses from a single recording session (e.g., if multiple birds are identified).
            *   `parentRunId`: (Optional) If this run is on a processed sub-recording, this is the ID of the original run.
            *   `inputAudioUrl`: The path to the user's recording in Firebase Storage.
            *   `habitatPhotoUrl`: (string, optional) Path to a user-uploaded habitat photo.
            *   `locationData`: Any location info provided by the user.
            *   `analysisMethod`: A string identifying the AI model and prompt system version used (e.g., 'bird-identifier-ai-v1.1').
            *   `processingMethod`: (Optional) A tag describing how audio was altered (e.g., 'noise-reduced-v1', 'call-isolation-v1').
            *   `aiResult`: The complete, raw output from the AI.
            *   `wasSuccessful`: A boolean indicating if the AI identified a bird.
            *   `wasSavedByUser`: A boolean flag, set to `true` only if the user chooses to save the result to their log.
            *   `dataQualityScore`: A calculated score indicating the reliability and value of this data point.

*   **Tier 2: The User-Facing "Bird Book" (Visible to Users)**
    *   This collection contains only the identifications that users have explicitly saved. It's their personal, curated album, synced to the cloud.
    *   **Top-Level Collection:** `users`
        *   **Document (ID: `USER_UID_FROM_AUTH`):**
            *   **Subcollection:** `identifications`
                *   **Document (ID: `UNIQUE_LOG_ID`):**
                    *   Contains the user-facing data: `commonName`, `scientificName`, `family`, `order`, `description`, `audioUrl`, `imageUrl` (the canonical URL), `userImageUrl` (optional, user-specific photo URL), etc.
            *   **Subcollection:** `themes`
                *   Contains documents for each of the user's saved theme slots (e.g., '0', '1', '2').
            *   **Subcollection:** `user_media`
                *   **Document (ID: `UNIQUE_MEDIA_ID`):**
                    *   `storagePath`: Path to the user-uploaded file in `users/{userId}/uploads/{mediaId}`.
                    *   `type`: 'habitat-photo' or 'bird-photo'.
                    *   `timestamp`: Upload timestamp.

---

## Part 3: Long-Term Data Strategy

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
