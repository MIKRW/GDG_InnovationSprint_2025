import { config } from 'dotenv';
config();

// This file is used for local Genkit development.
// It initializes the Google AI plugin for the local development server,
// allowing it to use Application Default Credentials for authentication.
// This file is NOT included in the Next.js build, so it does not
// affect the deployed application.
//
// The actual AI initialization for the Next.js app happens in `src/ai/genkit.ts`.
