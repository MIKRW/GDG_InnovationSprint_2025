# Task List

- Integrate a live weather API (e.g., Open-Meteo) to replace the simulated weather data in the `getCurrentWeather` Genkit tool.

---

## AI Prompt Enhancements

- Update the `identify-bird-flow` prompt to intelligently use the new "Habitat Profile" data. The AI needs to be instructed on how to prioritize evidence: a user-provided habitat photo should be the primary source of truth, followed by the user's text description, and finally falling back to inferences from GPS coordinates and weather data. The prompt should also instruct the AI to generate a list of structured `aiGeneratedHabitatTags` based on its analysis of the habitat.

## AI theme generator

- ** currently working, needs adjusting currently themes are consistnely using a off white as one of the colours, due to contrast being priotised, white is not the only colour that can make a good contrast for easy reading. 
---

## Audio & Recording

- **Implement Lossless Recording**: For "Twitcher Mode", investigate and implement a high-fidelity recording system using the browser's `AudioWorklet` API. This would involve capturing raw audio buffers and manually encoding them into a lossless `.wav` file on the client-side before upload, providing the AI with the maximum possible data for analysis.

- **Setup bluetooth connection/regonition for external microphones. Benefit of external microphone is better audio quality then you can achieve with the hardware in mobile devices depending on which external microphone you use.  -- Make sure to be able to connect multiple external microphones for future features being planned. (use data from mutliple mics to predict bird location)

---

## Backend & Cloud Functions

- **Review Deletion Logic**: Check the parameters being passed to the `onUserLogDisowned` Cloud Function and update the logic as needed to ensure file deletions are handled correctly and securely.

---

## Robustness & UX

- **Implement Retry Logic**: For user-facing network operations (like audio uploads), implement a retry mechanism to handle temporary network failures or slow connections, improving the app's resilience.

---

## Authentication System

- **Re-implement Anonymous Authentication**: Carefully re-introduce the anonymous authentication flow. The goal is to create a stable, client-side-only authentication system that avoids race conditions with Next.js server-side rendering. This will be the foundation for all user-specific features.

---

## Future Tools & Extensions

- **Browser Extension for Metadata Scraping**: Develop a browser extension that can automatically scrape metadata (author, license, location, etc.) from a source URL (like Xeno-canto or Macaulay Library) when a developer is uploading a new master audio file.

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

- ** Check for compatibiilty with screen readers/tech (look that up), make sure pages are consistent and the right cards/wrappers are being used across the app. 

