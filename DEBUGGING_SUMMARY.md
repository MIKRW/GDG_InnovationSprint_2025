# General Debugging Checklist

To make future debugging sessions faster, here is a checklist of common issues and steps to consider when troubleshooting this Next.js application:

1.  **Restart the Dev Server:** If code changes don't appear or behavior seems illogical (especially after many quick changes), stop and restart the development server. This is the primary fix for stale cache issues, which can mimic code errors.

2.  **Check Browser Console for Hydration Errors:** Always look for the `Hydration failed...` error. It's a critical clue that the server-rendered HTML and client-rendered HTML do not match. The error details often point to the exact component.

3.  **Check for Missing API Keys**: If you are using a feature that relies on an external service, such as the AI-powered theme generator, make sure you have provided the necessary API key. The application will look for a `GEMINI_API_KEY` in your `.env` file. Without it, any call to the AI will fail.

4.  **Isolate the Problem:** Try to reproduce the error on a minimal component or a new page. If the error disappears, it suggests a conflict with parent components or global styles.

5.  **Use React DevTools:** Inspect the component in the browser using React DevTools. Check its props and state to ensure they are what you expect them to be at render time.

6.  **Hard Refresh the Browser:** Sometimes the browser's own cache can be the problem. Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) to bypass the local cache.

7.  **Review Prop and HTML Structure:** Double-check for invalid HTML nesting (e.g., a `<p>` inside another `<p>`) or incorrect prop types being passed to a component.

## How to Restart the Server in Firebase Studio

In the Firebase Studio web environment, the development server is restarted through the built-in terminal:

1.  In the top bar of the editor, click on **"Switch to Code"**.
2.  Click the **hamburger menu icon** (three horizontal lines) in the top-left corner of the code editor pane.
3.  Select **"New terminal"** from the dropdown menu.
4.  A terminal window will appear at the bottom of the screen. Click inside of it to give it focus.
5.  Press **`Ctrl`** + **`C`** on your keyboard to stop the currently running server process.
6.  The server will restart automatically. If it does not, you may need to run `npm run dev` again in the same terminal.
