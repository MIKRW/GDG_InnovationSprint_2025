# Developer Testing Framework Plan

This document outlines the step-by-step plan to build a robust testing framework directly into the application. This will allow for consistent, repeatable testing of the AI's performance.

---

### Step 1: Environment Variable for Developer Mode

- **Goal:** Create a mechanism to show or hide testing-related UI elements.
- **Action:**
    1. Create a `.env.local` file at the project root.
    2. Add the environment variable `NEXT_PUBLIC_DEV_MODE=true` to this file.
    3. We will wrap all developer-specific UI (like the file upload button and test log link) in a condition that checks if this variable is true.
- **Outcome:** Test features will be visible during development but completely hidden from the final production build, ensuring a clean user experience.

---

### Step 2: Master Audio File Storage

- **Goal:** Establish a consistent location for the master test audio file.
- **Action:**
    1. Manually create a `public` folder at the root of the project.
    2. Inside the `public` folder, create an `audio` folder.
    3. Place the master test file (e.g., `test-bird-song.wav`) inside `public/audio/`.
- **Outcome:** The test file will be reliably accessible at a predictable URL (e.g., `/audio/test-bird-song.wav`), allowing for repeatable tests.

---

### Step 3: Separate Test Logs & UI

- **Goal:** Create a dedicated area to view test results, keeping them separate from regular user logs.
- **Action:**
    1. Create a new page component at `/log/test`.
    2. Add a new "Test Results" card to the main logbook page (`LogPage.tsx`). This card will link to the `/log/test` page.
    3. Both the "Test Results" card and the existing "Upload Audio File" button on the record page will be conditionally rendered based on the `NEXT_PUBLIC_DEV_MODE` environment variable.
- **Outcome:** A clean separation between user data and test data, accessible only in developer mode.

---

### Step 4: Save Historical Test Results

- **Goal:** Create a persistent log of all test runs to track AI performance over time.
- **Action:**
    1. Create a new file at `docs/test-log.json` to act as our test database.
    2. Modify the `identifyBirdBySound` AI flow. When in developer mode, after an analysis is complete, the flow will be updated to append the result to `docs/test-log.json`.
- **Outcome:** We will have a valuable dataset of historical test results, which can be used to analyze the AI's accuracy, identify patterns, and inform future prompt engineering efforts.

---

## Implementation Summary (Post-Implementation Review)

This summary was added after the features were implemented.

A review of the codebase confirmed that all goals from the original plan were achieved and, in some cases, significantly improved upon.

-   **Steps 1 & 3 (Dev Mode & UI):** Implemented as planned. A `NEXT_PUBLIC_DEV_MODE` environment variable successfully controls the display of developer-only UI components, including a dedicated test log page at `/log/test`.
-   **Steps 2 & 4 (Data Storage):** Superseded by a more robust architecture. Instead of using local `public` folders and `.json` files, the application now uses a professional-grade cloud solution:
    -   Master audio files are stored in **Firebase Storage**.
    -   All test results are saved to a queryable **`all_test_runs` collection in Firestore**.

This implementation is more scalable, secure, and better aligned with modern web development best practices than the original plan.
