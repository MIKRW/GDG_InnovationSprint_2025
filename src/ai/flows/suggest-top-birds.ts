'use server';

/**
 * @fileOverview Suggests the top three most probable birds in an audio recording by combining bird prediction, audio analysis, and likelihood ranking.
 *
 * - suggestTopBirds - A function that suggests the top three birds.
 * - SuggestTopBirdsInput - The input type for the suggestTopBirds function.
 * - SuggestTopBirdsOutput - The return type for the suggestTopBirds function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTopBirdsInputSchema = z.object({
  birdPrediction: z
    .array(z.string())
    .describe('List of birds predicted in the area.'),
  audioAnalysis: z
    .array(z.string())
    .describe('List of birds identified from audio analysis.'),
  likelihoodRanking: z
    .array(z.string())
    .describe('List of birds ranked by likelihood based on environmental factors.'),
});
export type SuggestTopBirdsInput = z.infer<typeof SuggestTopBirdsInputSchema>;

const SuggestTopBirdsOutputSchema = z.object({
  topBirds: z
    .array(z.string())
    .describe('Top three most probable birds in the audio recording.'),
});
export type SuggestTopBirdsOutput = z.infer<typeof SuggestTopBirdsOutputSchema>;

export async function suggestTopBirds(input: SuggestTopBirdsInput): Promise<SuggestTopBirdsOutput> {
  return suggestTopBirdsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTopBirdsPrompt',
  input: {schema: SuggestTopBirdsInputSchema},
  output: {schema: SuggestTopBirdsOutputSchema},
  prompt: `Combine the following information to suggest the top three most probable birds in the audio recording. Return just the names of the top three birds.\n\nBird Prediction: {{{birdPrediction}}}\nAudio Analysis: {{{audioAnalysis}}}\nLikelihood Ranking: {{{likelihoodRanking}}}`,
});

const suggestTopBirdsFlow = ai.defineFlow(
  {
    name: 'suggestTopBirdsFlow',
    inputSchema: SuggestTopBirdsInputSchema,
    outputSchema: SuggestTopBirdsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
