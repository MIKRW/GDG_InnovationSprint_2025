'use server';

/**
 * @fileOverview Predicts possible bird species in a given location based on environmental data and past sightings.
 *
 * - predictPossibleBirds - An async function that takes location data or user input and returns a list of likely bird species with likelihood rankings.
 * - PredictPossibleBirdsInput - The input type for the predictPossibleBirds function, including location data.
 * - PredictPossibleBirdsOutput - The return type for the predictPossibleBirds function, providing a list of possible bird species and their likelihood rankings.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictPossibleBirdsInputSchema = z.object({
  latitude: z.number().optional().describe('Latitude of the location.'),
  longitude: z.number().optional().describe('Longitude of the location.'),
  environmentDetails: z.string().optional().describe('Optional user-provided details about the environment if location data is unavailable.'),
});
export type PredictPossibleBirdsInput = z.infer<typeof PredictPossibleBirdsInputSchema>;

const PossibleBirdSchema = z.object({
  speciesName: z.string().describe('The common name of the bird species.'),
  scientificName: z.string().describe('The scientific name of the bird species.'),
  likelihoodRanking: z.string().describe('A ranking of how likely the bird is to be found in the area (High, Medium, Low).'),
  description: z.string().describe('A short description of the bird and its habitat.'),
});

const PredictPossibleBirdsOutputSchema = z.array(PossibleBirdSchema).describe('A list of possible bird species and their likelihood rankings.');
export type PredictPossibleBirdsOutput = z.infer<typeof PredictPossibleBirdsOutputSchema>;

export async function predictPossibleBirds(input: PredictPossibleBirdsInput): Promise<PredictPossibleBirdsOutput> {
  return predictPossibleBirdsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictPossibleBirdsPrompt',
  input: {schema: PredictPossibleBirdsInputSchema},
  output: {schema: PredictPossibleBirdsOutputSchema},
  prompt: `You are an expert ornithologist. Based on the provided location data or environment details, you will predict which bird species are most likely to be found in the area.

  Consider factors such as habitat, migration patterns, and previous sightings. Provide a likelihood ranking for each species (High, Medium, Low).

  If location data (latitude and longitude) is available, use it to determine the environment profile. If not, use the user-provided environment details.

  Location Data:
  Latitude: {{{latitude}}}
  Longitude: {{{longitude}}}

  Environment Details: {{{environmentDetails}}}

  Format your response as a JSON array of objects with the following fields for each bird species:
  - speciesName: The common name of the bird species.
  - scientificName: The scientific name of the bird species.
  - likelihoodRanking: A ranking of how likely the bird is to be found in the area (High, Medium, Low).
  - description: A short description of the bird and its habitat.
  `,
});

const predictPossibleBirdsFlow = ai.defineFlow(
  {
    name: 'predictPossibleBirdsFlow',
    inputSchema: PredictPossibleBirdsInputSchema,
    outputSchema: PredictPossibleBirdsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
