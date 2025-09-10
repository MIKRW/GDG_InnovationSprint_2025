
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
  prompt: `
    You are an expert ornithologist with the ability to identify bird species by their songs.
    Analyze the following audio data to identify the bird species.

    Audio data: {{media url=audioDataUri}}

    {{#if locationDescription}}
    The recording was made in or near: "{{locationDescription}}".
    Use this information as a strong hint to narrow down the possible bird species. To do this, compare the user's text with publicly available data from reliable sources like government sites, public databases, and well-known field guides to understand the bird's known geographic range and habitat. A bird not typically found in this location is less likely to be the correct identification.
    {{else if latitude}}
    The recording was made at the absolute location of latitude: {{latitude}}, longitude: {{longitude}}.
    Use this precise location as a primary factor to determine the possible bird species. Cross-reference these coordinates with publicly available data from reliable sources (like government sites, public databases, and well-known field guides) to determine the bird's known geographic range and habitat. A bird that is not found in this exact area is highly unlikely to be the correct identification.
    {{/if}}

    Your task is to return a JSON object with the following structure:
    - isBirdSong: A boolean indicating if you are confident a bird song is present in the audio.
    - commonName: The common name of the bird.
    - scientificName: The scientific (Latin) name of the bird.
    - description: A brief, interesting fact about the bird.
    - imagePrompt: A simple but effective text-to-image prompt to generate a photo of this bird.

    If the audio does not contain a discernible bird song, set "isBirdSong" to false and leave the other fields empty.
    Do not invent a bird. If you are uncertain, it is better to indicate that no bird song was identified.
  `,
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
