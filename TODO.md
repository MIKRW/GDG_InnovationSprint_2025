# Task List

This is a list of tasks and ideas for improving the application.

- Review and implement a fully dynamic/flexible layout for the GridContainer.
- make the swatches run vertically but keep the colour square for asthetics
- Integrate a live weather API (e.g., Open-Meteo) to replace the simulated weather data in the `getCurrentWeather` Genkit tool.

---

## AI Prompt Enhancements

- Update the `identify-bird-flow` prompt to intelligently use the new "Habitat Profile" data. The AI needs to be instructed on how to prioritize evidence: a user-provided habitat photo should be the primary source of truth, followed by the user's text description, and finally falling back to inferences from GPS coordinates and weather data. The prompt should also instruct the AI to generate a list of structured `aiGeneratedHabitatTags` based on its analysis of the habitat.