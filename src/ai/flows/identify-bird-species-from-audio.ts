'use server';
/**
 * @fileOverview Identifies bird species from audio recordings.
 *
 * - identifyBirdSpeciesFromAudio - A function that identifies bird species from audio.
 * - IdentifyBirdSpeciesFromAudioInput - The input type for the identifyBirdSpeciesFromAudio function.
 * - IdentifyBirdSpeciesFromAudioOutput - The return type for the identifyBirdSpeciesFromAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyBirdSpeciesFromAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio recording, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  environmentProfile: z.string().optional().describe("The profile of the environment, based on location data or user input."),
  birdPrediction: z.string().optional().describe("List of bird predictions for the area based on previous sightings."),
  likelihoodRanking: z.string().optional().describe("List of birds that would possibly be found in this area based on comparison to research data and public information."),
});
export type IdentifyBirdSpeciesFromAudioInput = z.infer<typeof IdentifyBirdSpeciesFromAudioInputSchema>;

const IdentifyBirdSpeciesFromAudioOutputSchema = z.object({
  topBirdSuggestions: z.array(
    z.object({
      species: z.string().describe('The identified bird species.'),
      confidence: z.number().describe('The confidence level of the identification.'),
      reasoning: z.string().describe('The reasoning behind this identification.'),
    })
  ).describe('The top bird suggestions based on the audio analysis and environmental data.'),
});
export type IdentifyBirdSpeciesFromAudioOutput = z.infer<typeof IdentifyBirdSpeciesFromAudioOutputSchema>;

export async function identifyBirdSpeciesFromAudio(input: IdentifyBirdSpeciesFromAudioInput): Promise<IdentifyBirdSpeciesFromAudioOutput> {
  return identifyBirdSpeciesFromAudioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyBirdSpeciesFromAudioPrompt',
  input: {schema: IdentifyBirdSpeciesFromAudioInputSchema},
  output: {schema: IdentifyBirdSpeciesFromAudioOutputSchema},
  prompt: `You are an expert ornithologist specializing in bird species identification from audio recordings. Analyze the provided audio recording and consider the additional environmental data to identify the bird species present. Provide the top bird suggestions based on your analysis.

Audio Recording: {{media url=audioDataUri}}

{{#if environmentProfile}}
Environment Profile: {{environmentProfile}}
{{/if}}

{{#if birdPrediction}}
Bird Prediction: {{birdPrediction}}
{{/if}}

{{#if likelihoodRanking}}
Likelihood Ranking: {{likelihoodRanking}}
{{/if}}

Output the top bird suggestions with species name, confidence level, and reasoning.
`,
});

const identifyBirdSpeciesFromAudioFlow = ai.defineFlow(
  {
    name: 'identifyBirdSpeciesFromAudioFlow',
    inputSchema: IdentifyBirdSpeciesFromAudioInputSchema,
    outputSchema: IdentifyBirdSpeciesFromAudioOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
