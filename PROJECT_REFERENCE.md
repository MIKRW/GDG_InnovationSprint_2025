# ChirpID Project Reference

This file contains a list of key custom components, style variants, and UI states specific to the ChirpID application. You can use this as a quick reference when discussing changes.

---

### **Component Names**

These are the main building blocks of your app.

*   **Layout Components:**
    *   `AppLayout`: The main container for the entire application screen.
    *   `Footer`: The navigation bar at the bottom.
    *   `ResizePrompt`: The message that shows when the window is too small.
*   **App-Specific Components:**
    *   `Logo`: The main bird icon.
    *   `Byline`: The "Your pocket guide to bird songs" text.
    *   `BirdLogClient`: The component that displays the list of logged birds.
    *   `BirdCard`: The card that shows a single bird's photo and details in the results.
*   **Pages:**
    *   `LandingPage`: The initial home screen (`/`).
    *   `RecordPage`: The page for recording audio (`/record`).
    *   `BirdLogPage`: The page displaying your bird log (`/log`).
    *   `SettingsPage`: The settings screen (`/settings`).

### **Button Variants**

When you want to change a button's style, you can refer to its `variant`.

*   `default`: The standard primary button (e.g., "Analyze", "Yes, log it!").
*   `destructive`: For actions that delete something (e.g., "Stop Recording", "Clear Log").
*   `outline`: A button with a border and no background (e.g., "Start Over").
*   `secondary`: A less prominent button (e.g., "Show other options").
*   `nav`: The square icon buttons in the `Footer` (e.g., Home, Log, Settings).
*   `record`: The large, circular "Tap to Record" button.

### **UI States (on the Record Page)**

The `RecordPage` can be in several different states. You can ask to change what's shown during any of these moments.

*   `idle`: The initial state with the big "record" button.
*   `recording`: The state shown while the microphone is actively recording.
*   `preview`: The state shown after recording stops, allowing you to listen before analyzing.
*   `loading`: The state with the spinning loader while the AI is working.
*   `results`: The state displaying the `BirdCard` suggestions.
*   `location_prompt`: The dialog asking for a manual environment description.
*   `error`: The state shown when an analysis fails.