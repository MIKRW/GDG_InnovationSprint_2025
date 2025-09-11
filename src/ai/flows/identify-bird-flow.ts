
'use server';
/**
 * @fileOverview An AI flow for identifying bird species from audio recordings.
 *
 * - identifyBirdBySound - A function that analyzes an audio recording to identify a bird.
 * - IdentifyBirdInput - The input type for the identifyBirdBySound function.
 * - IdentifyBirdOutput - The return type for the identifyBirdBySound function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import promptText from '@/ai/prompts/bird-identification-prompt.txt';

const IdentifyBirdInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A recording of a bird song, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
    latitude: z.number().optional().describe('The latitude of where the recording was made.'),
    longitude: z.number().optional().describe('The longitude of where the recording was made.'),
    locationDescription: z.string().optional().describe('A user-provided text description of the location (e.g., postcode, city, national park name).'),
});
export type IdentifyBirdInput = z.infer<typeof IdentifyBirdInputSchema>;

const IdentifyBirdOutputSchema = z.object({
  isBirdSong: z.boolean().describe('Whether or not the audio is believed to contain a bird song.'),
  commonName: z.string().optional().describe("The common name of the identified bird (e.g., 'American Robin')."),
  scientificName: z.string().optional().describe("The scientific name of the identified bird (e.g., 'Turdus migratorius')."),
  description: z.string().optional().describe('A brief, interesting fact or description about the bird.'),
  imagePrompt: z.string().optional().describe('A simple, descriptive prompt for a text-to-image model to generate a picture of the bird (e.g., "photo of an American Robin on a branch").'),
});
export type IdentifyBirdOutput = z.infer<typeof IdentifyBirdOutputSchema>;

export async function identifyBirdBySound(
  input: IdentifyBirdInput
): Promise<IdentifyBirdOutput> {
  return await identifyBirdFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyBirdPrompt',
  input: { schema: IdentifyBirdInputSchema },
  output: { schema: IdentifyBirdOutputSchema },
  prompt: promptText,
});

const identifyBirdFlow = ai.defineFlow(
  {
    name: 'identifyBirdFlow',
    inputSchema: IdentifyBirdInputSchema,
    outputSchema: IdentifyBirdOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The model failed to return a valid analysis.');
    }
    return output;
  }
);
