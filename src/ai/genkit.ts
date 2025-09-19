import {genkit} from 'genkit';

// This file exports the base genkit object.
// Plugins, such as googleAI, should be initialized within the specific
// flows that use them to ensure access to runtime environment variables.
export const ai = genkit({
  model: 'googleai/gemini-2.5-flash',
});
