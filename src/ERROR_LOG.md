# Application Error Log

This document tracks recurring errors, their root causes, the solutions implemented, and the number of times they have been resolved.

---

### Error Type: 503 Service Unavailable (AI Model Overloaded)

- **Occurrences**: 2
- **Description**: The application fails to generate a theme, and a console error indicates `[503 Service Unavailable] The model is overloaded`.
- **Cause**: This is not a bug in the application's code. It occurs when the external Google Generative AI service, which powers the theme generation, is temporarily experiencing high traffic and cannot process the request.
- **Solution**:
    1. A specific state variable (`isApiOverloaded`) was added to the `ThemeGenerator` component.
    2. The theme generation logic in `onSubmit` now includes a `catch` block that checks for error messages containing "503" or "overloaded".
    3. If this specific error is detected, `isApiOverloaded` is set to `true`.
    4. The "Generate Theme" button's content conditionally renders "AI Busy, Try Again" when `isApiOverloaded` is true, providing clear, direct user feedback and preventing repeated clicks.

---

### Error Type: `localStorage` Data Structure Mismatch

- **Occurrences**: 2
- **Description**: A runtime error `Error: Cannot read properties of undefined (reading 'h')` occurs when loading or interacting with themes.
- **Cause**: This happens after updating the `Theme` data structure (e.g., adding the `ring` color property) when the user's browser `localStorage` still contains theme objects in the old format, which lack the new property. The code crashes when it attempts to access a sub-property of the non-existent new property (e.g., `colors.ring.h`).
- **Solution**:
    1. **Component-Level Fallback**: In `ThemeHistoryItem.tsx`, the code was updated to provide a fallback. If `colors.ring` is undefined, it uses `colors.primary` instead. This allows older theme swatches to render without crashing.
    2. **CSS-Variable-Level Fallback**: In `ThemeGenerator.tsx`, the `updateCSSVariables` function was also updated. It checks for the existence of `colors.ring` before attempting to set the custom CSS variables, using `colors.primary` as a fallback if the `ring` property is missing from the active theme. This prevents crashes when applying an older theme.

---

### Error Type: Nested Click Handlers & Faulty CSS Broke Component

- **Occurrences**: 1
- **Description**: The rotate button on the manual theme editor swatch was unclickable. Subsequent fix attempts caused the entire theme to break, resulting in an unstyled black-and-white UI.
- **Cause**: The root cause was an event propagation issue. The rotate button's `onClick` event was being intercepted by `onClick` events on its parent elements (the swatch card and color squares). An attempt to fix this by restructuring the component's JSX introduced an invalid style property `border: 2px solid ${styles.ring}` directly on a component, which is not valid JSX styling. This crashed the component's rendering, which in turn prevented the theme's CSS variables from being applied, breaking the entire page's styling.
- **Solution**:
    1. The unclickable button was fixed by ensuring its `onClick` handler correctly called `event.stopPropagation()` to prevent the event from bubbling up to parent elements.
    2. The critical rendering bug was fixed by removing the invalid inline style from the color swatch `divs` inside `ManualThemeEditor.tsx`. The selection state is now correctly indicated by a border on the parent swatch container, which was the intended design and avoids styling conflicts.

---

### Error Type: Stale Active Theme in `localStorage`

- **Occurrences**: 1
- **Description**: When exiting a theme preview via the `ContrastButton`, the app would revert to a previously saved theme, not the one that was most recently active.
- **Cause**: The application state and the `localStorage` state were out of sync. When a user selected a theme from a save slot, the app's internal state would update to make it "active", but this change was not immediately being written to the `active-theme-json` key in `localStorage`. The `ContrastButton`'s logic relied on this key to restore the correct theme after a preview. Because the key held stale data, an old theme was loaded.
- **Solution**:
    1. The `handleSlotClick` and `saveThemeToSlot` functions in `ThemeGenerator.tsx` were updated to immediately write the new active theme to the `active-theme-json` key in `localStorage` whenever a theme is selected or saved into an active slot.
    2. This ensures that `localStorage` always has a fresh, accurate record of the true active theme, which the `ContrastButton` can then reliably read from to restore the correct state.

---

### Error Type: Flash of Incorrect Theme on Load

- **Occurrences**: 1
- **Description**: On a full page load or hot-reload, the application would briefly flash the default (light) theme's styles before showing the correct, user-selected custom theme.
- **Cause**: The root cause was a timing issue inherent to client-side rendering. The logic to apply the custom theme's colors was located in a React `useEffect` hook. This hook only runs on the client-side *after* the initial HTML has been rendered by the browser. This created a race condition where the browser would momentarily display the default styles before the client-side script could execute and apply the correct custom theme from `localStorage`.
- **Solution**:
    1.  The logic for applying the theme was moved out of the React component lifecycle entirely.
    2.  A blocking, synchronous `<script>` tag was embedded directly into the `<head>` of the main `src/app/layout.tsx` file.
    3.  This script executes immediately, before the browser renders the `<body>`. It reads the `theme` and `active-theme-json` from `localStorage` and injects the correct CSS class name and HSL color variables into the document's root element.
    4.  By setting the theme before the initial render, the flash of incorrect styles is completely eliminated, ensuring a seamless user experience. All related client-side `useEffect` logic was removed as it was now redundant.

---