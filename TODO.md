# ChirpID Task List

This is a list of tasks and ideas for improving the ChirpID application.

## High Priority
- [ ] Implement user accounts and persistent storage for bird logs (e.g., using Firebase).
- [ ] Improve the bird identification accuracy by fine-tuning the AI model.

## Medium Priority
- [ ] Add a "bird of the day" feature to the home screen.
- [ ] Allow users to share their identified birds on social media.
- [ ] Create a map view to show where birds have been logged.

## Low Priority
- [ ] Add different color themes for the app.
- [ ] Implement gamification (badges, streaks) for identifying birds.

## Design
- [ ] Create logo in Illustrator and save as SVG file.
    - **Workflow for a theme-aware logo:**
    1. Export the logo from Illustrator as an SVG file.
    2. Open the .svg file in a text editor and copy the code.
    3. Paste the SVG code into `src/components/chirp-id/Logo.tsx`.
    4. In the SVG code, find `fill` or `stroke` attributes with color values (e.g., `fill="#RRGGBB"`).
    5. Change these color values to `fill="currentColor"` or `stroke="currentColor"`. This allows the logo to inherit its color from the app's theme, making it adaptable to features like high-contrast mode.
