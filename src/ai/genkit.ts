'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This file exports a single, configured Genkit object.
// The googleAI() plugin is initialized here, and it will automatically
// use the appropriate credentials for the environment:
// - In the IDE, it uses Application Default Credentials.
// - On the deployed server, it uses the provided GEMINI_API_KEY secret.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
