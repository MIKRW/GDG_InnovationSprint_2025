
'use server';
/**
 * @fileOverview An AI flow for generating a bird image from a text prompt.
 *
 * - generateBirdImage - A function that creates an image from a text prompt.
 * - GenerateBirdImageInput - The input type for the generateBirdImage function.
 * - GenerateBirdImageOutput - The return type for the generateBirdImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

const GenerateBirdImageInputSchema = z.object({
  prompt: z.string().describe('A descriptive text prompt for generating a bird image, e.g., "photo of an American Robin on a branch".'),
});
export type GenerateBirdImageInput = z.infer<typeof GenerateBirdImageInputSchema>;

const GenerateBirdImageOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateBirdImageOutput = z.infer<typeof GenerateBirdImageOutputSchema>;

export async function generateBirdImage(
  input: GenerateBirdImageInput
): Promise<GenerateBirdImageOutput> {
  return await generateBirdImageFlow(input);
}

const generateBirdImageFlow = ai.defineFlow(
  {
    name: 'generateBirdImageFlow',
    inputSchema: GenerateBirdImageInputSchema,
    outputSchema: GenerateBirdImageOutputSchema,
  },
  async (input) => {
    // Initialize the plugin within the flow to ensure access to runtime environment variables.
    ai.registerPlugin(googleAI());
    
    // Using a specific image generation model
    const { media } = await ai.generate({
        model: googleAI.model('imagen-4.0-fast-generate-001'),
        prompt: input.prompt,
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to return media.');
    }

    return { imageDataUri: media.url };
  }
);
