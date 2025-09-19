
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This file configures and exports the Genkit 'ai' object.
// It uses a robust pattern to handle authentication for both local development and production.
//
// - In the local development environment, it expects a `GEMINI_API_KEY` to be loaded
//   from a .env.local file by the `src/ai/dev.ts` entrypoint.
// - In the deployed App Hosting environment, it expects a `GEMINI_API_KEY` to be
//   injected as a secret via the `apphosting.yaml` configuration.

if (!process.env.GEMINI_API_KEY) {
  // This check runs when the server starts, both locally and in production.
  // If the key is missing, we throw an error to prevent the app from
  // running in a broken state.
  throw new Error(
    'The GEMINI_API_KEY environment variable is missing. ' +
    'Please add it to your .env.local file for local development or ' +
    'ensure it is configured as a secret in your apphosting.yaml for production.'
  );
}

const plugins = [googleAI({ apiKey: process.env.GEMINI_API_KEY })];

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.5-flash',
});
