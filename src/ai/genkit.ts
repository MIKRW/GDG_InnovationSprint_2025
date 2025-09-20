







import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebaseConfig } from '@/lib/firebase-config';

// This file configures and exports the Genkit 'ai' object.
// It uses Application Default Credentials (ADC) for authentication.
// - In production on App Hosting, it uses the attached service account's IAM role.
// - In local development, it uses the credentials from `gcloud auth application-default login`.
// This approach avoids the need for API keys.

const plugins = [
  googleAI({ projectId: firebaseConfig.projectId })
];

export const ai = genkit({
  plugins,
});
