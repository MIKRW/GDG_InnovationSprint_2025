
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebaseConfig } from '@/lib/firebase-config';

// This file configures and exports the Genkit 'ai' object.
// It uses a robust method to handle authentication for both local
// development and production.

const plugins = [];

// The googleAI() plugin, when called without arguments, automatically
// searches for the best authentication method available in the environment.
// This includes standard Application Default Credentials (ADC) found in production,
// credentials from a `gcloud auth application-default login` command, or an
// API key set in the GEMINI_API_KEY environment variable.
plugins.push(googleAI());

export const ai = genkit({
  plugins,
});
