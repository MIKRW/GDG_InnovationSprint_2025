
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebaseConfig } from '@/lib/firebase-config';

// This file configures and exports the Genkit 'ai' object.
// It uses a robust method to handle authentication for both local
// development and production.

const plugins = [];

// Check if we are running in the deployed Firebase App Hosting environment.
// process.env.APP_HOSTING_URL is a system-provided environment variable on App Hosting.
const isProduction = !!process.env.APP_HOSTING_URL;

if (isProduction) {
  // In production, force the use of Application Default Credentials.
  // This will use the service account identity ('firebase-app-hosting-compute@...')
  // and its assigned IAM roles. We explicitly provide the project ID to avoid ambiguity.
  plugins.push(googleAI());
} else {
  // In local development, first check for an API key in .env.
  if (process.env.GEMINI_API_KEY) {
    plugins.push(googleAI({ apiKey: process.env.GEMINI_API_KEY}));
  } else {
    // If no API key, fall back to Application Default Credentials for local development.
    // This works if you've run `gcloud auth application-default login`.
    plugins.push(googleAI());
  }
}

export const ai = genkit({
  plugins,
});
