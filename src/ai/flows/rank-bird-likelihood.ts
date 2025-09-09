'use server';

/**
 * @fileOverview Ranks the likelihood of birds in a given area based on environmental profile and location.
 *
 * - rankBirdLikelihood - A function that ranks bird likelihood.
 * - RankBirdLikelihoodInput - The input type for the rankBirdLikelihood function.
 * - RankBirdLikelihoodOutput - The return type for the rankBirdLikelihood function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RankBirdLikelihoodInputSchema = z.object({
  environmentProfile: z
    .string()
    .describe(
      'A description of the environment including vegetation, weather, and if it is natural or man-made.'
    ),
  locationData: z.string().describe('Location data of the user.'),
});
export type RankBirdLikelihoodInput = z.infer<typeof RankBirdLikelihoodInputSchema>;

const RankBirdLikelihoodOutputSchema = z.array(z.object({
  birdSpecies: z.string().describe('The common name of the bird species.'),
  likelihoodScore: z
    .number()
    .describe('A score (0-1) representing the likelihood of the bird being present.'),
  justification: z
    .string()
    .describe('Explanation of why this bird is likely to be found in the area.'),
}));
export type RankBirdLikelihoodOutput = z.infer<typeof RankBirdLikelihoodOutputSchema>;

export async function rankBirdLikelihood(input: RankBirdLikelihoodInput): Promise<RankBirdLikelihoodOutput> {
  return rankBirdLikelihoodFlow(input);
}

const rankBirdLikelihoodPrompt = ai.definePrompt({
  name: 'rankBirdLikelihoodPrompt',
  input: {schema: RankBirdLikelihoodInputSchema},
  output: {schema: RankBirdLikelihoodOutputSchema},
  prompt: `You are an expert ornithologist with a deep knowledge of bird habitats, migration patterns, and environmental preferences.

  Based on the provided environmental profile and location data, generate a ranked list of bird species that are most likely to be found in the area.

  Environment Profile: {{{environmentProfile}}}
  Location Data: {{{locationData}}}

  Consider factors such as vegetation type, weather conditions, proximity to water sources, and known migration routes.

  Each bird species should have a likelihood score between 0 and 1, representing the probability of the bird being present.

  Provide a brief justification for each bird species, explaining why it is likely to be found in the area.

  Format your output as a JSON array of objects, with each object containing the bird species, likelihood score, and justification.`,
});

const rankBirdLikelihoodFlow = ai.defineFlow(
  {
    name: 'rankBirdLikelihoodFlow',
    inputSchema: RankBirdLikelihoodInputSchema,
    outputSchema: RankBirdLikelihoodOutputSchema,
  },
  async input => {
    const {output} = await rankBirdLikelihoodPrompt(input);
    return output!;
  }
);
