
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This file configures and exports the Genkit 'ai' object.
// It is configured to use an API key.
//
// - In the local development environment, it reads the API key from
//   the `AI_GEN_MIRACLE_KEY` variable in the `.env` file.
// - In the deployed App Hosting environment, the `apphosting.yaml` file
//   configures the backend to load the specified secret from Secret Manager
//   and expose it as an environment variable with the same name.

const plugins = [
  googleAI({
    apiKey: process.env.AI_GEN_MIRACLE_KEY,
  }),
];

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.5-flash',
});
