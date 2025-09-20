
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { isDevMode } from '@/lib/utils';
import { firebaseConfig } from '@/lib/firebase-config';

// This file configures and exports the Genkit 'ai' object.
// It uses a robust method to handle authentication for both local
// development and production.

const plugins = [];

if (isDevMode() && process.env.AI_GEN_MIRACLE_KEY) {
  // Use API key for local development if it's provided in .env
  plugins.push(googleAI({ apiKey: process.env.AI_GEN_MIRACLE_KEY }));
} else {
  // Use Application Default Credentials for production and local fallback.
  // In production, this automatically uses the service account identity.
  // Locally, this works if you've run `gcloud auth application-default login`.
  // We explicitly provide the project ID to ensure correctness in all environments.
  plugins.push(googleAI({ projectId: firebaseConfig.projectId }));
}

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.5-flash',
});
