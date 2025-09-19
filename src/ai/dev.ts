import { config } from 'dotenv';
config();

import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

// This file is used for local Genkit development.
// It initializes the Google AI plugin for the local development server,
// allowing it to use Application Default Credentials for authentication.
// This file is NOT included in the Next.js build, so it does not
// affect the deployed application.
genkit({
  plugins: [googleAI()],
});
