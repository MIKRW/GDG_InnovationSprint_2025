# Firebase Studio

This is a NextJS starter in Firebase Studio. This app is deployed with Firebase App Hosting.

To get started, take a look at src/app/page.tsx.

---

## First-Time Setup Guide: Authorizing the AI

This application's backend server uses Google's Application Default Credentials (ADC) to securely connect to Google AI services, which is the recommended best practice. This avoids the need to manage API keys.

To make this work, you need to perform a one-time setup for your local development environment and for your deployed application.

### 1. Production (One-Time Cloud Setup)

Your deployed application needs permission to use the Gemini API.

1.  **Go to the IAM Page:** Navigate to the [IAM page](https://console.cloud.google.com/iam-admin/iam) in the Google Cloud Console for your project.
2.  **Find the Service Account:** Locate the principal (service account) named `firebase-app-hosting-compute@<YOUR_PROJECT_ID>.iam.gserviceaccount.com`.
3.  **Grant Permission:** Click the pencil icon to edit its roles. Click **"Add another role"** and select the **"Vertex AI User"** role.
4.  **Save** your changes.

Your deployed application now has permanent permission to use the AI.

### 2. Local Development (One-Time Local Setup)

Your local development server also needs permission. It gets this by using your personal Google account credentials.

1.  **Install the Google Cloud CLI:** If you haven't already, [install the gcloud CLI](https://cloud.google.com/sdk/docs/install).
2.  **Run the Login Command:** Open your terminal and run the following command. This will open a browser window for you to log in to your Google account.

    ```bash
    gcloud auth application-default login
    ```

Once you've completed this, your local development server (`npm run dev`) will automatically have permission to make AI calls, just like the production server.
