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
