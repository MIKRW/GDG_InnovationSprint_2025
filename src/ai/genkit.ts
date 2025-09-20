
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const plugins = [googleAI()];

// In Genkit v1.x, plugins are passed directly to the `genkit()` constructor.
// The `configureGenkit` function is no longer used for this purpose.
export const ai = genkit({
  plugins,
});
