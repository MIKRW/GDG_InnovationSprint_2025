# Firebase Studio

This is a NextJS starter in Firebase Studio. This app is deployed with Firebase App Hosting.

To get started, take a look at src/app/page.tsx.

---

## First-Time Setup Guide: Authorizing the AI

This application uses Google's Secret Manager to securely handle the Gemini API key. This is a best practice to avoid exposing sensitive keys directly in the code.

To make this work, you need to perform a one-time setup for your local development environment and for your deployed application.

### 1. Production (One-Time Cloud Setup)

Your deployed application needs permission to access the secret you created.

1.  **Go to the IAM Page:** Navigate to the [IAM page](https://console.cloud.google.com/iam-admin/iam) in the Google Cloud Console for your project.
2.  **Find the Service Account:** Locate the principal (service account) named `firebase-app-hosting-compute@<YOUR_PROJECT_ID>.iam.gserviceaccount.com`.
3.  **Grant Permission:** Click the pencil icon to edit its roles. Click **"Add another role"** and select the **"Secret Manager Secret Accessor"** role.
4.  **Save** your changes.

Your deployed application now has permanent permission to read the secrets defined in `apphosting.yaml`.

### 2. Local Development (One-Time Local Setup)

Your local development server needs the API key to make calls.

1.  **Create a `.env` file:** If it doesn't already exist, create a file named `.env` in the root of your project.
2.  **Add the API Key:** Add the following line to your `.env` file, pasting your actual API key after the `=` sign.

    ```bash
    AI_GEN_MIRACLE_KEY=YOUR_GEMINI_API_KEY_HERE
    ```
3. **Restart the Server:** If your `npm run dev` server is running, stop it and restart it for the change to take effect.

Once you've completed this, your local development server will have the key it needs to make AI calls.
