# Task List

- **Fix Recording Button Lifecycle**: The record button currently has a React lifecycle issue ("Maximum update depth exceeded") that prevents it from correctly starting and stopping. Investigate the cause of the infinite loop, research robust solutions for handling the component's state and audio processing callbacks, and implement the fix.

- **Integrate Live Weather API**: Replace the simulated weather data in the `getCurrentWeather` Genkit tool with a real weather API (e.g., Open-Meteo).

---

## AI Prompt Enhancements

- **Update Bird Identification Prompt**: Enhance the `identify-bird-flow` prompt to intelligently use the "Habitat Profile" data. The AI needs to prioritize evidence: a user-provided habitat photo should be the primary source, followed by the user's text description, and finally falling back to inferences from GPS coordinates and weather data. The prompt should also instruct the AI to generate a list of structured `aiGeneratedHabitatTags` based on its analysis of the habitat.

## AI Theme Generator

- **Improve Color Variety**: The AI theme generator sometimes defaults to off-white backgrounds to ensure high contrast. Adjust the prompt to encourage more creative and colorful palettes while still adhering to accessibility standards. White is not the only color that provides good contrast for readability.

---

## Audio & Recording

- **Implement Lossless Recording for "Twitcher Mode"**: Investigate and implement a high-fidelity recording system using the browser's `AudioWorklet` API. This would involve capturing raw audio buffers and manually encoding them into a lossless `.wav` file on the client-side before upload, providing the AI with the maximum possible data for analysis.

- **External Microphone Support**: Add support for connecting and recognizing external Bluetooth microphones. This will allow for higher-quality audio capture and enable future features like using data from multiple microphones to predict bird locations.

---

## Backend & Cloud Functions

- **Review Deletion Logic**: Check the parameters being passed to the `onUserLogDisowned` Cloud Function and update the logic as needed to ensure file deletions are handled correctly and securely.

- **Automated Cleanup**: Implement automatic, time-based cleanup of inactive anonymous user accounts and their associated data in Firestore and Firebase Storage.

---

## Robustness & UX

- **Implement Retry Logic**: For user-facing network operations (like audio uploads), implement a retry mechanism to handle temporary network failures or slow connections, improving the app's resilience.

---

## Authentication System

- **Re-implement Anonymous Authentication**: Carefully re-introduce the anonymous authentication flow. The goal is to create a stable, client-side-only authentication system that avoids race conditions with Next.js server-side rendering. This will be the foundation for all user-specific features.

---

## Future Tools & Extensions

- **Metadata Scraper Browser Extension**: Develop a browser extension that can automatically scrape metadata (author, license, location, etc.) from a source URL (like Xeno-canto or Macaulay Library) when a developer is uploading a new master audio file.

- **Embedded Metadata Extraction**: Implement a feature to automatically parse and import embedded metadata (e.g., ID3 tags) from master audio files upon upload.

---

## Future Implementation Plan

- **Implement Firestore Error Logging**: Build the necessary services and UI to create, view, and manage error logs based on the architecture defined in `docs/ERROR_LOG.md`.
- **Set Up Automated Error Logging**: Create a global error handler in Next.js to automatically capture unhandled exceptions and log them as `error_instances` in Firestore.
- **Proceed to Stage 4**: Begin work on "Stage 4: Implement Data Integrity & Security", focusing on securing user data and application access.

---

## User Account & Data Management Strategy

- **Implement Anonymous User Upgrading**: Build the user registration flow to link new permanent credentials (e.g., email/password) to the user's existing anonymous account, ensuring a seamless transfer of all their data.
- **Implement Data Retention Policy**: Create scheduled cloud functions to automatically clean up inactive and low-value anonymous user data from Firestore and Firebase Storage based on the rules defined in `docs/firestore-data-model.md`.

## UI Features to add/ check

- **Screen Reader Compatibility**: Check for compatibility with screen readers and other assistive technologies. Ensure pages are consistent and use the correct cards/wrappers across the app for a uniform experience.
