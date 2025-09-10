
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

const GenerateThemeInputSchema = z.object({
  word1: z.string().describe('A word to inspire a color.'),
  word2: z.string().describe('A second word to inspire a color.'),
  word3: z.string().describe('A third word to inspire a color.'),
  mood: z.string().describe('A word to describe the overall mood of the theme (e.g., "dark", "light", "calm", "80s").'),
});
export type GenerateThemeInput = z.infer<typeof GenerateThemeInputSchema>;


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
    You are an expert UI theme designer with a deep understanding of color theory, word association, and accessibility standards.
    Your task is to generate a creative, unique, and aesthetically pleasing HSL color palette based on user input.

    The user has provided three inspirational words and a mood.
    - Words: "{{word1}}", "{{word2}}", "{{word3}}"
    - Mood: "{{mood}}"

    Your job is to intelligently assign one word to the background, one to the foreground, and one to the primary accent color.
    Base your assignments on color theory. For example, a darker, less saturated color is usually best for a background, while a brighter, more saturated color makes a good accent.

    When choosing colors, base your selections on the real-world colors associated with the input words.
    To do this, you should research how established color brands (like Pantone or paint companies) name their colors.
    For example, if a user provides the word "eggshell", you should associate it with a natural, off-white color.
    If they say "lavender" or "forest green", learn from professional color systems to choose an appropriate shade.
    
    After selecting the initial colors, use the 'mood' as a strong guideline to modify and adjust the final HSL values.
    For example, a 'dark' mood should result in lower lightness values for the background. A 'vibrant' mood should increase saturation. 'High Contrast' should maximize the lightness difference between background and foreground.

    You must return an object with three HSL color objects: 'background', 'foreground', and 'primary'.
    
    - The 'foreground' color MUST have a high contrast ratio with the background color for accessibility and readability.
    - The 'primary' color also MUST have a high contrast ratio with the background.
    
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
