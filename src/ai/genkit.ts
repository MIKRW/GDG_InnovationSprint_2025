import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { isDevMode } from '@/lib/utils';

// This file exports a conditionally configured Genkit object.
// In the IDE (dev mode), it initializes the googleAI plugin immediately,
// allowing it to use Application Default Credentials for local development.
// In production, the plugin is initialized within the flows to access
// runtime environment variables.

const plugins = [];
if (isDevMode()) {
  plugins.push(googleAI());
}

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.5-flash',
});
