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

const GenerateThemeInputSchema = z.object({
  background: z.string().describe('A word to inspire the background color (e.g., "sand", "sky", "forest").'),
  foreground: z.string().describe('A word to inspire the foreground text color (e.g., "stone", "ink", "snow").'),
  primary: z.string().describe('A word to inspire the primary accent color (e.g., "ocean", "sunset", "gold").'),
});
export type GenerateThemeInput = z.infer<typeof GenerateThemeInputSchema>;

const ThemeColorSchema = z.object({
  h: z.number().describe('The hue value (0-360).'),
  s: z.number().describe('The saturation value (0-100).'),
  l: z.number().describe('The lightness value (0-100).'),
});

const GenerateThemeOutputSchema = z.object({
  background: ThemeColorSchema.describe('The background color of the theme.'),
  foreground: ThemeColorSchema.describe('The primary text/content color, ensuring high contrast with the background.'),
  primary: ThemeColorSchema.describe('The main accent color for buttons and highlights, ensuring high contrast with the background.'),
});
export type GenerateThemeOutput = z.infer<typeof GenerateThemeOutputSchema>;


export async function generateTheme(
  words: GenerateThemeInput
): Promise<GenerateThemeOutput> {
  return await generateThemeFlow(words);
}

const prompt = ai.definePrompt({
  name: 'generateThemePrompt',
  input: { schema: GenerateThemeInputSchema },
  output: { schema: GenerateThemeOutputSchema },
  prompt: `
    You are an expert UI theme designer with a deep understanding of color theory and word association.
    Your task is to generate a creative and aesthetically pleasing HSL color palette based on three words provided by the user.

    You must return an object with three HSL color objects: 'background', 'foreground', and 'primary'.

    - The 'background' color should be inspired by the word: "{{background}}".
    - The 'foreground' color should be inspired by the word: "{{foreground}}". It MUST have a high contrast ratio with the background color for accessibility.
    - The 'primary' color should be inspired by the word: "{{primary}}". It also MUST have a high contrast ratio with the background.
    
    Interpret the user's words creatively to generate a harmonious and visually appealing theme.
  `,
});


const generateThemeFlow = ai.defineFlow(
  {
    name: 'generateThemeFlow',
    inputSchema: GenerateThemeInputSchema,
    outputSchema: GenerateThemeOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate theme from the model.');
    }
    return output;
  }
);
