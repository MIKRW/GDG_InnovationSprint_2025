'use server';

/**
 * @fileOverview An AI flow for generating a custom theme palette.
 *
 * - generateTheme - A function that creates a color theme from a text prompt.
 * - GenerateThemeInput - The input type for the generateTheme function.
 * - GenerateThemeOutput - The return type for the generateTheme function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { ThemeColor } from '@/lib/types';

const GenerateThemeInputSchema = z.string().describe('A text description of the desired theme (e.g., "a warm desert sunset" or "a cool, futuristic neon vibe").');
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
  description: GenerateThemeInput
): Promise<GenerateThemeOutput> {
  return await generateThemeFlow(description);
}

const prompt = ai.definePrompt({
  name: 'generateThemePrompt',
  input: { schema: GenerateThemeInputSchema },
  output: { schema: GenerateThemeOutputSchema },
  prompt: `
    You are an expert UI theme designer. Your task is to generate a color palette
    based on the user's text description.

    You must return an object with three HSL color objects: 'background', 'foreground', and 'primary'.

    - The 'background' color is the main canvas of the app.
    - The 'foreground' color is for text and icons, and it MUST have a high contrast ratio with the background color for accessibility.
    - The 'primary' color is for interactive elements like buttons. It also MUST have a high contrast ratio with the background.

    Follow these rules for the HSL values:
    - h (hue) must be between 0 and 360.
    - s (saturation) must be between 0 and 100.
    - l (lightness) must be between 0 and 100.

    User's theme description: "{{{prompt}}}"
  `,
});


const generateThemeFlow = ai.defineFlow(
  {
    name: 'generateThemeFlow',
    inputSchema: GenerateThemeInputSchema,
    outputSchema: GenerateThemeOutputSchema,
  },
  async (promptText) => {
    const { output } = await prompt(promptText);
    if (!output) {
      throw new Error('Failed to generate theme from the model.');
    }
    return output;
  }
);
