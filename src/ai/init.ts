

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { isDevMode } from '@/lib/utils';

// This file is intended for creating a Genkit configuration object.
// It should not contain the 'use server' directive as it exports an object,
// which is not a valid server action export.

// Initialize plugins conditionally based on the environment.
const plugins = [];
if (isDevMode()) {
  // In development (IDE), rely on Application Default Credentials.
  plugins.push(googleAI());
}

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.5-flash',
});
