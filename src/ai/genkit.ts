
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { isDevMode } from '@/lib/utils';

// This file configures and exports the Genkit 'ai' object.
// This single configuration works for both local development (using ADC) and
// the deployed environment (using the GEMINI_API_KEY secret).

export const ai = genkit({
  plugins: [
    // In dev mode, googleAI() will use Application Default Credentials.
    // In production, the API key is passed in the flow.
    isDevMode() ? googleAI() : undefined,
  ].filter(i => !!i) as any,
  model: 'googleai/gemini-2.5-flash',
});
