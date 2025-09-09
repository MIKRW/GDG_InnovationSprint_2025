import { config } from 'dotenv';
config();

import '@/ai/flows/identify-bird-species-from-audio.ts';
import '@/ai/flows/analyze-audio-for-bird-sounds.ts';
import '@/ai/flows/generate-environment-profile.ts';
import '@/ai/flows/rank-bird-likelihood.ts';
import '@/ai/flows/predict-possible-birds.ts';
import '@/ai/flows/suggest-top-birds.ts';