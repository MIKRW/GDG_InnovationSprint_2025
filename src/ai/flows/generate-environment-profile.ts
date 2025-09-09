'use server';

/**
 * @fileOverview Generates an environment profile based on location data or user input.
 *
 * - generateEnvironmentProfile - A function that generates the environment profile.
 * - GenerateEnvironmentProfileInput - The input type for the generateEnvironmentProfile function.
 * - GenerateEnvironmentProfileOutput - The return type for the generateEnvironmentProfile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEnvironmentProfileInputSchema = z.object({
  locationData: z
    .string()
    .optional()
    .describe('Location data of the user, if available.'),
  manualInput: z
    .string()
    .optional()
    .describe('Manual input from the user describing the environment.'),
});
export type GenerateEnvironmentProfileInput = z.infer<
  typeof GenerateEnvironmentProfileInputSchema
>;

const GenerateEnvironmentProfileOutputSchema = z.object({
  environmentProfile: z.string().describe('The generated environment profile.'),
});
export type GenerateEnvironmentProfileOutput = z.infer<
  typeof GenerateEnvironmentProfileOutputSchema
>;

export async function generateEnvironmentProfile(
  input: GenerateEnvironmentProfileInput
): Promise<GenerateEnvironmentProfileOutput> {
  return generateEnvironmentProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEnvironmentProfilePrompt',
  input: {schema: GenerateEnvironmentProfileInputSchema},
  output: {schema: GenerateEnvironmentProfileOutputSchema},
  prompt: `You are an AI assistant designed to create detailed environment profiles.

  Based on the available location data or user input, generate a profile of the environment.
  Include details such as:
  - Type of environment (natural or man-made)
  - Vegetation in the area
  - Current weather conditions
  - Whether the area is tropical or temperate
  - Any recent natural events like bushfires or flooding

  If location data is available:
  Location Data: {{{locationData}}}

  If location data is unavailable, use user input:
  User Input: {{{manualInput}}}
  `,
});

const generateEnvironmentProfileFlow = ai.defineFlow(
  {
    name: 'generateEnvironmentProfileFlow',
    inputSchema: GenerateEnvironmentProfileInputSchema,
    outputSchema: GenerateEnvironmentProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
