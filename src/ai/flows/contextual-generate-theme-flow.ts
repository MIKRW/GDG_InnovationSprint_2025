
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
import { THEME_PROMPT } from '@/ai/prompts/theme-prompt';

const ThemeColorSchema = z.object({
  h: z.number().describe('The hue value (0-360).'),
  s: z.number().describe('The saturation value (0-100).'),
  l: z.number().describe('The lightness value (0-100).'),
});

const GenerateThemeOutputSchema = z.object({
  background: ThemeColorSchema.describe('The background color of the theme.'),
  foreground: ThemeColorSchema.describe(
    'The primary text/content color, ensuring high contrast with the background.'
  ),
  primary: ThemeColorSchema.describe(
    'The main accent color for buttons and highlights, ensuring high contrast with the background.'
  ),
  ring: ThemeColorSchema.describe(
    "A color for UI highlights like selections. It should be a shade of the 'primary' color, with a lightness value that is at least 10-15% lighter or darker to ensure it is always visible as a selection state."
  ),
});
export type GenerateThemeOutput = z.infer<typeof GenerateThemeOutputSchema>;

const GenerateThemeInputSchema = z.object({
  word1: z.string().optional().describe('A word to inspire a color.'),
  word2: z.string().optional().describe('A second word to inspire a color.'),
  word3: z.string().optional().describe('A third word to inspire a color.'),
  mood: z.string().describe(
    'A keyword that defines the desired aesthetic and accessibility constraints (e.g., "High Contrast", "Tritanopia-Friendly", "Vibrant", "Dark").'
  ),
});
export type GenerateThemeInput = z.infer<typeof GenerateThemeInputSchema>;


export async function generateTheme(
  input: GenerateThemeInput
): Promise<GenerateThemeOutput> {
  return await generateThemeFlow(input);
}

const generateThemeFlow = ai.defineFlow(
  {
    name: 'generateThemeFlow',
    inputSchema: GenerateThemeInputSchema,
    outputSchema: GenerateThemeOutputSchema,
  },
  async (input) => {
    try {
      const themePrompt = ai.definePrompt({
        name: 'simpleThemePrompt',
        prompt: THEME_PROMPT,
        input: { schema: GenerateThemeInputSchema },
        output: { schema: GenerateThemeOutputSchema },
        config: {
          temperature: 0.7, // Increase creativity
        },
      });

      const response = await themePrompt(input);
      const output = response.output;

      if (!output) {
        if (response.finishReason === 'safety') {
            throw new Error('The AI refused to generate a theme due to its safety filters. Please try different words.');
        }
        throw new Error('The AI model failed to return a valid theme.');
      }

      return output;

    } catch (error) {
      console.error('Error in generateThemeFlow:', error);
      // Re-throw the error to be caught by the calling component
      throw error;
    }
  }
);
