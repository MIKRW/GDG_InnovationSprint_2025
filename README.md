# Firebase Studio

This is a NextJS starter in Firebase Studio. This app is deployed with Firebase App Hosting.

To get started, take a look at src/app/page.tsx.

---

## First-Time Deployment Guide: Setting Up the AI

This application's backend server requires a `GEMINI_API_KEY` to securely connect to the Google AI services. For your first deployment, you must manually create this secret.

**This is a one-time setup.**

### Step 1: Create the Secret in Google Cloud

1.  **Go to the Secret Manager:** Navigate to the [Secret Manager](https://console.cloud.google.com/security/secret-manager) page in the Google Cloud Console for your project.
2.  **Create a New Secret:**
    *   Click **"Create Secret"**.
    *   For the **Name**, enter `GEMINI_API_KEY`.
    *   In the **Secret value** field, paste your actual Gemini API key.
    *   Leave the other settings as their defaults and click **"Create Secret"**.

### Step 2: Enable the Secret in Your App

1.  **Open `apphosting.yaml`:** In your project's code, open the `apphosting.yaml` file.
2.  **Uncomment the Secret:** Find the `secrets` section and uncomment the line to look like this:
    ```yaml
    secrets: [GEMINI_API_KEY]
    ```
3.  **Deploy Your App:** You can now deploy your application. Firebase App Hosting will securely provide the key from Secret Manager to your backend.

### Local Development

For local development, ensure you have a `.env.local` file in the root of your project with the following content:

```
GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

This file is ignored by version control and will only be used on your local machine.
