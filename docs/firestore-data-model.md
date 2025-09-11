# Firestore Data Architecture Plan

This document outlines the complete data architecture for the ChirpID application, covering both developer testing and live user data. This architecture is designed to be robust, scalable, and secure.

---

## Part 1: The Developer/Test Data Model

This model is designed for our internal, controlled testing. It is structured around the bird species itself, allowing us to easily manage and run tests for specific birds. To enable efficient searching and filtering by scientific classification, each bird document will include its taxonomic family and order.

*   **Top-Level Collection:** `birds`
    *   Each document represents a bird species. The Document ID will be a unique slug (e.g., `australian-magpie`).
    *   **Document:** `birds/australian-magpie`
        *   `commonName`: "Australian Magpie"
        *   `scientificName`: "Gymnorhina tibicen"
        *   `family`: "Artamidae" // e.g., Woodswallows, butcherbirds, etc.
        *   `order`: "Passeriformes" // e.g., Perching birds
        *   **Subcollection:** `testAudio`
            *   Each document represents a master test recording for that species.
            *   **Document:** `testAudio/magpie-warble-1`
                *   **Fields:** Contains all metadata for the audio file: `author`, `license`, `hardware`, `description`, and `storagePath` (a link to the `.wav` file in Firebase Storage).
                *   **Subcollection:** `testRuns`
                    *   Each document is a log of a single AI analysis run on this specific test audio.
                    *   **Document:** `testRuns/run-2024-07-28-103000`
                        *   **Fields:** Contains the `aiResult` (the full output from the AI), a `timestamp`, and the version of the prompt that was used.

---

## Part 2: The Live User Data Model

This professional, two-tiered model perfectly separates our need for analytical data from the user's control over their personal log.

*   **Tier 1: The Internal Analysis Log (Invisible to Users)**
    *   This collection is our comprehensive, internal log of every single analysis performed by the app.
    *   **Top-Level Collection:** `all_analysis_runs`
        *   **Document (ID: `UNIQUE_RUN_ID`):**
            *   `timestamp`: The time of the analysis.
            *   `userId`: The user's unique ID.
            *   `inputAudioUrl`: The path to the user's recording in Firebase Storage.
            *   `locationData`: Any location info provided.
            *   `analysisMethod`: A string identifying the AI model and technique used (e.g., 'audio-gemini-2.5-flash').
            *   `aiResult`: The complete, raw output from the AI.
            *   `wasSuccessful`: A boolean indicating if the AI identified a bird.
            *   `wasSavedByUser`: A boolean flag, set to `true` only if the user chooses to save the result to their log.

*   **Tier 2: The User-Facing "Bird Book" (Visible to Users)**
    *   This collection contains only the identifications that users have explicitly saved. It's their personal, curated album.
    *   **Top-Level Collection:** `users`
        *   **Document (ID: `USER_UID_FROM_AUTH`):**
            *   **Subcollection:** `identifications`
                *   **Document (ID: `UNIQUE_LOG_ID`):**
                    *   **For Successful IDs:** Contains the formatted data (`commonName`, `scientificName`, `family`, `order`, `description`, etc.) and a reference to the audio file.
                    *   **For Mystery Recordings:** Contains `isMystery: true`, a conventional name like "Mystery Recording - [Date]", and a reference to the audio file.

---

## Part 3: Architectural Review & Long-Term Data Strategy

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

To ensure a seamless, multi-device user experience and prevent data loss, the user's "Bird Book" will be architected as a cloud-first system.

*   **Single Source of Truth:** The `users/{userId}/identifications` collection in Firestore is the user's permanent, authoritative record of their saved identifications.
*   **Local Cache:** The browser's `localStorage` will be used as a temporary cache for fast, offline access.
*   **Syncing Logic:**
    1.  On app startup, the user's "Bird Book" is fetched from Firestore and hydrated into the local cache.
    2.  When offline, the app reads from this local cache.
    3.  When a user saves a new identification, the app writes it to both Firestore and the local cache.
*   **Benefit:** This model guarantees that a user's collection is never lost. It is always backed up to the cloud and can be accessed or restored from any device, providing the professional and reliable user experience we aim for.
