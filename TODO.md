# Task List

This is a list of tasks and ideas for improving the application.

- Review and implement a fully dynamic/flexible layout for the GridContainer.
- make the swatches run vertically but keep the colour square for asthetics
- Integrate a live weather API (e.g., Open-Meteo) to replace the simulated weather data in the `getCurrentWeather` Genkit tool.

---

## AI Prompt Enhancements

- Update the `identify-bird-flow` prompt to intelligently use the new "Habitat Profile" data. The AI needs to be instructed on how to prioritize evidence: a user-provided habitat photo should be the primary source of truth, followed by the user's text description, and finally falling back to inferences from GPS coordinates and weather data. The prompt should also instruct the AI to generate a list of structured `aiGeneratedHabitatTags` based on its analysis of the habitat.

---

## Future Implementation Plan

- **Implement Firestore Error Logging**: Build the necessary services and UI to create, view, and manage error logs based on the architecture defined in `docs/ERROR_LOG.md`.
- **Set Up Automated Error Logging**: Create a global error handler in Next.js to automatically capture unhandled exceptions and log them as `error_instances` in Firestore.
- **Proceed to Stage 4**: Begin work on "Stage 4: Implement Data Integrity & Security", focusing on securing user data and application access.
