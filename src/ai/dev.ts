
import { config } from 'dotenv';
config();

// This file is used for local Genkit development. It ensures that any
// environment variables in a .env file are loaded, which can be useful
// for local testing, but it does not initialize any plugins itself.
// The main Genkit configuration in `src/ai/genkit.ts` handles initialization.
import './genkit';
