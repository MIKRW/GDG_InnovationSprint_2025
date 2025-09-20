
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { isDevMode } from '@/lib/utils';

// This file configures and exports the Genkit 'ai' object.
// It uses a robust method to handle authentication for both local
// development and production.
//
// - In the deployed App Hosting environment, it uses the application's
//   built-in service account identity. This is the recommended and most
//   secure method, and it requires the service account to have the
//   "Vertex AI User" role in IAM.
//
// - In the local development environment, it checks for an API key in the
//   `AI_GEN_MIRACLE_KEY` environment variable (loaded from the .env file).
//   This provides a simple way for developers to test using their own key.

const plugins = [];

if (isDevMode() && process.env.AI_GEN_MIRACLE_KEY) {
  // Use API key for local development if it's provided
  plugins.push(googleAI({ apiKey: process.env.AI_GEN_MIRACLE_KEY }));
} else {
  // Use Application Default Credentials for production and local fallback.
  // In production, this automatically uses the service account.
  // Locally, this will work if the developer has run `gcloud auth application-default login`.
  plugins.push(googleAI());
}

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.5-flash',
});
