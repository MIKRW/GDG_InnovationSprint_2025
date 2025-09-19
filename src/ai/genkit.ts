
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This file configures and exports the Genkit 'ai' object.
// By initializing the googleAI() plugin without any parameters, we are telling
// Genkit to use Application Default Credentials (ADC).
//
// - In the deployed App Hosting environment, it will use the backend's
//   runtime service account, which has been granted permission to access the AI APIs.
// - In the local development environment, it will use the credentials from the
//   local gcloud CLI setup (`gcloud auth application-default login`).
//
// This is the most secure and robust authentication method.

const plugins = [googleAI()];

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.5-flash',
});
