
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This file configures and exports the Genkit 'ai' object.
// It uses a robust pattern to handle authentication for both local development and production.
//
// - In the local development environment, it expects a `GEMINI_API_KEY` to be loaded
//   from the `.env.local` file by the `dev.ts` entrypoint.
// - In the deployed App Hosting environment, the environment variable will NOT be present.
//   In this case, the googleAI() plugin automatically uses Application Default Credentials (ADC)
//   and the backend's runtime service account, which has been granted the necessary permissions.

const plugins = [googleAI({ apiKey: process.env.GEMINI_API_KEY })];

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.5-flash',
});
