
import { genkit, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebaseConfig } from '@/lib/firebase-config';

const plugins = [googleAI()];

configureGenkit({
  plugins,
});

export const ai = genkit();
