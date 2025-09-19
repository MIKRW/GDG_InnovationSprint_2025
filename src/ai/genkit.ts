
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This file configures and exports the Genkit 'ai' object.
// This single configuration works for both local development (using ADC) and
// the deployed environment (using the GEMINI_API_KEY secret).

const plugins = [];

// On the production server, the GEMINI_API_KEY will be available as an environment variable.
// In the local IDE, it will be undefined.
if (process.env.GEMINI_API_KEY) {
  // Production: Authenticate using the provided API key.
  plugins.push(googleAI({ apiKey: process.env.GEMINI_API_KEY }));
} else {
  // Development: No API key provided, so Genkit will fall back to
  // Application Default Credentials (ADC) from the local gcloud setup.
  plugins.push(googleAI());
}

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.5-flash',
});
