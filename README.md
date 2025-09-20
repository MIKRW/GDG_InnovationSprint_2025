# Firebase Studio

This is a NextJS starter in Firebase Studio. This app is deployed with Firebase App Hosting.

To get started, take a look at src/app/page.tsx.

---

## First-Time Setup Guide: Authorizing the AI

This application uses Google Cloud's recommended authentication methods to securely handle API access. This avoids exposing sensitive keys directly in the code.

To make this work, you need to perform a one-time setup for your local development environment and for your deployed application.

### 1. Production (One-Time Cloud Setup)

Your deployed application needs permission to access the Vertex AI API. This is done by granting a role to its built-in service account.

1.  **Go to the IAM Page:** Navigate to the [IAM page](https://console.cloud.google.com/iam-admin/iam) in the Google Cloud Console for your project.
2.  **Find the Service Account:** Locate the principal (service account) named `firebase-app-hosting-compute@<YOUR_PROJECT_ID>.iam.gserviceaccount.com`.
3.  **Grant Permission:** Click the pencil icon to edit its roles. Click **"Add another role"** and select the **"Vertex AI User"** role.
4.  **Save** your changes.

Your deployed application now has permanent permission to call the AI services.

### 2. Local Development (One-Time Local Setup)

Your local development server needs credentials to make calls on your behalf. There are two ways to do this:

#### Option A: Recommended (gcloud CLI)

This is the most secure method. It uses your personal Google account credentials without needing an API key file.

1.  **Install the gcloud CLI:** If you don't have it, [install the Google Cloud CLI](https://cloud.google.com/sdk/docs/install).
2.  **Log In:** Run the following command in your terminal. It will open a browser window for you to log in to your Google account.
    ```bash
    gcloud auth application-default login
    ```
3.  **Restart the Server:** If your `npm run dev` server is running, stop it and restart it for the change to take effect.

#### Option B: API Key (Alternative)

If you prefer to use a traditional API key for local development:

1.  **Create a `.env` file:** If it doesn't already exist, create a file named `.env` in the root of your project.
2.  **Add the API Key:** Add the following line to your `.env` file, pasting your actual Gemini API key after the `=` sign.
    ```bash
    AI_GEN_MIRACLE_KEY=YOUR_GEMINI_API_KEY_HERE
    ```
3. **Restart the Server:** If your `npm run dev` server is running, stop it and restart it for the change to take effect.
