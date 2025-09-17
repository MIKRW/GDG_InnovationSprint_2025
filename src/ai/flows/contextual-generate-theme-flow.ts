
'use server';

/**
 * @fileOverview An AI flow for generating a custom theme palette from three words.
 *
 * - generateTheme - A function that creates a color theme from words.
 * - GenerateThemeInput - The input type for the generateTheme function.
 * - GenerateThemeOutput - The return type for the generateTheme function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { ThemeColor } from '@/lib/types';
import { logErrorToFirestore } from '@/lib/error-logging';
import { getComposedPrompt } from '@/lib/actions';
import { devThemePrompt } from '@/ai/prompts/dev-theme-prompt';


const ThemeColorSchema = z.object({
  h: z.number().describe('The hue value (0-360).'),
  s: z.number().describe('The saturation value (0-100).'),
  l: z.number().describe('The lightness value (0-100).'),
});

const GenerateThemeOutputSchema = z.object({
  background: ThemeColorSchema.describe('The background color of the theme.'),
  foreground: ThemeColorSchema.describe('The primary text/content color, ensuring high contrast with the background.'),
  primary: ThemeColorSchema.describe('The main accent color for buttons and highlights, ensuring high contrast with the background.'),
  ring: ThemeColorSchema.describe("A color for UI highlights like selections. It should be a shade of the 'primary' color, with a lightness value that is at least 10-15% lighter or darker to ensure it is always visible as a selection state."),
});
export type GenerateThemeOutput = z.infer<typeof GenerateThemeOutputSchema>;

const GenerateThemeInputSchema = z.object({
  word1: z.string().optional().describe('A word to inspire a color.'),
  word2: z.string().optional().describe('A second word to inspire a color.'),
  word3: z.string().optional().describe('A third word to inspire a color.'),
  mood: z.string().describe('A keyword that defines the desired aesthetic and accessibility constraints (e.g., "High Contrast", "Tritanopia-Friendly", "Vibrant", "Dark").'),
  isDeveloperRequest: z.boolean().optional().describe('A flag to indicate if this is a developer test request.'),
});
export type GenerateThemeInput = z.infer<typeof GenerateThemeInputSchema>;


export async function generateTheme(
  words: GenerateThemeInput
): Promise<GenerateThemeOutput> {
  // Determine if this is a developer request based on the environment variable.
  const isDeveloper = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const inputWithDevFlag = { ...words, isDeveloperRequest: isDeveloper };
  
  return await generateThemeFlow(inputWithDevFlag);
}

const generateThemeFlow = ai.defineFlow(
  {
    name: 'generateThemeFlow',
    inputSchema: GenerateThemeInputSchema,
    outputSchema: GenerateThemeOutputSchema,
  },
  async (input) => {
    try {
      let promptTemplate: string | null;

      if (input.isDeveloperRequest) {
        console.log("Using developer theme prompt.");
        promptTemplate = devThemePrompt;
      } else {
        console.log("Using live theme prompt from Firestore.");
        promptTemplate = await getComposedPrompt('theme-generator-ai');
      }

      if (!promptTemplate) {
        throw new Error('Failed to retrieve a valid prompt for theme generation.');
      }

      const { output } = await ai.generate({
          prompt: promptTemplate,
          input: input,
          model: 'googleai/gemini-2.5-flash',
          output: {
              schema: GenerateThemeOutputSchema
          }
      });

      if (!output) {
        throw new Error('Failed to generate theme from the model.');
      }
      return output;

    } catch (error) {
        console.error("Error in generateThemeFlow:", error);
        await logErrorToFirestore(error as Error, 'theme-generation-failure', {
            input: input,
        });
        // Re-throw the error to be caught by the calling client component
        throw error;
    }
  }
);
