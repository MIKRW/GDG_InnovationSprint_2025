
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This file configures and exports the Genkit 'ai' object.
// It does NOT contain 'use server' because it exports an object, not an async function.
// This single configuration works for both local development (using ADC) and
// the deployed environment (using the GEMINI_API_KEY secret).

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
