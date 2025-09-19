
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This file configures and exports the Genkit 'ai' object.
// It uses Application Default Credentials (ADC) for authentication.
//
// - In the local development environment, it relies on the user being logged
//   in via `gcloud auth application-default login`.
// - In the deployed App Hosting environment, it relies on the backend's
//   service account having the "Vertex AI User" role granted in IAM.
//
// This setup removes the need for managing API keys.

const plugins = [googleAI()];

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.5-flash',
});
