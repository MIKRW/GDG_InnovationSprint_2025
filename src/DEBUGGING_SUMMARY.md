# General Debugging Checklist

To make future debugging sessions faster, here is a checklist of common issues and steps to consider when troubleshooting this Next.js application:

1.  **Restart the Dev Server:** If code changes don't appear or behavior seems illogical (especially after many quick changes), stop and restart the development server. This is the primary fix for stale cache issues, which can mimic code errors.

2.  **Check Browser Console for Hydration Errors:** Always look for the `Hydration failed...` error. It's a critical clue that the server-rendered HTML and client-rendered HTML do not match. The error details often point to the exact component.

3.  **Check the Terminal for "Module Not Found" Errors:** After renaming or moving files, a `Module not found` error in the terminal is a common issue. This indicates a broken import path. Double-check that all `import` statements in the affected files point to the correct new file locations.

4.  **Check for Missing API Keys**: If you are using a feature that relies on an external service, such as the AI-powered theme generator, make sure you have provided the necessary API key. The application will look for a `GEMINI_API_KEY` in your `.env` file. Without it, any call to the AI will fail.

5.  **Avoid Hydration Mismatches from Client-Side State**: A common cause for hydration errors is when a component tries to use a value from a browser API (like `localStorage` or `window.matchMedia`) during its initial server render. The server doesn't have access to these, leading to a mismatch.

    *   **Incorrect:** `useState(localStorage.getItem('theme') || 'light')`
    *   **Correct:** Initialize state with a default value (`useState('light')`) and then use a `useEffect` hook to load the value from `localStorage` on the client-side after the component has mounted.

6.  **Isolate the Problem:** Try to reproduce the error on a minimal component or a new page. If the error disappears, it suggests a conflict with parent components or global styles.

7.  **Use React DevTools:** Inspect the component in the browser using React DevTools. Check its props and state to ensure they are what you expect them to be at render time.

8.  **Hard Refresh the Browser:** Sometimes the browser's own cache can be the problem. Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) to bypass the local cache.

9.  **Review Prop and HTML Structure:** Double-check for invalid HTML nesting (e.g., a `<p>` inside another `<p>`) or incorrect prop types being passed to a component.

## How to Restart the Server in Firebase Studio

In the Firebase Studio web environment, the development server is restarted through the built-in terminal:

1.  In the top bar of the editor, click on **"Switch to Code"**.
2.  Click the **hamburger menu icon** (three horizontal lines) in the top-left corner of the code editor pane.
3.  Select **"New terminal"** from the dropdown menu.
4.  A terminal window will appear at the bottom of the screen. Click inside of it to give it focus.
5.  Press **`Ctrl`** + **`C`** on your keyboard to stop the currently running server process.
6.  The server will restart automatically. If it does not, you may need to run `npm run dev` again in the same terminal.
