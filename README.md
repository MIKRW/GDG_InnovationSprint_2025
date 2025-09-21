# Firebase Studio

This is a NextJS starter in Firebase Studio. This app is deployed with Firebase App Hosting.

To get started, take a look at src/app/page.tsx.

---

## First-Time Setup Guide: Authorizing the AI & Storage

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

Your local development server needs credentials to make calls on your behalf.

#### Part A: Authorize the gcloud CLI (Most Secure)

This uses your personal Google account credentials without needing an API key file.

1.  **Install the gcloud CLI:** If you don't have it, [install the Google Cloud CLI](https://cloud.google.com/sdk/docs/install).
2.  **Log In:** Run the following command in your terminal. It will open a browser window for you to log in to your Google account.
    ```bash
    gcloud auth application-default login
    ```

#### Part B: Configure Local Storage Access (CORS)

To allow your local server to upload files (like audio recordings) to Firebase Storage, you must apply a Cross-Origin Resource Sharing (CORS) policy.

1.  **Find Your Bucket ID:** Go to the [Firebase Storage console](https://console.firebase.google.com/project/_/storage) for your project. Your bucket ID is shown at the top, usually in the format `gs://<YOUR_PROJECT_ID>.appspot.com`. Copy the `<YOUR_PROJECT_ID>.appspot.com` part.
2.  **Run Command:** In your terminal, at the root of this project, run the following command, replacing `YOUR_BUCKET_ID_HERE` with the ID you just copied.
    ```bash
    gcloud storage buckets update gs://YOUR_BUCKET_ID_HERE --cors-file=cors.json
    ```

#### Part C: Restart the Development Server

If your `npm run dev` server is running, stop it and restart it for all these changes to take effect.
